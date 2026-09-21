"""
ESP32-S3 Serial Image Ingestion Service
Receives raw JPEG frames transmitted from the N8R8 ESP32 receiver over USB Serial at 2,000,000 baud.
Saves incoming validated images directly to RECEIVED_IMAGES_DIR, automatically triggering the
CapturesManager filesystem watcher, GlacierWatch MobileNetV2 inference engine, and WebSocket live updates.
"""

import os
import time
import struct
import zlib
import threading
from pathlib import Path
from typing import Optional
from PIL import Image

try:
    import serial
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

from server.config import (
    SERIAL_ENABLED,
    SERIAL_PORT,
    SERIAL_BAUD,
    RECEIVED_IMAGES_DIR
)

MAGIC = b"GWIM"
USB_READY = 0x52
USB_ACK = 0x41
BLOCK_SIZE = 32768


class EspSerialReceiver:
    def __init__(self, port: str = SERIAL_PORT, baud: int = SERIAL_BAUD, output_dir: Path = RECEIVED_IMAGES_DIR):
        self.port = port
        self.baud = baud
        self.output_dir = output_dir
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._ser: Optional[serial.Serial] = None
        self._counter = 1

    def start(self):
        if not HAS_SERIAL:
            print("[EspReceiver] pyserial not available. Serial ingestion disabled.")
            return

        self._running = True
        self._thread = threading.Thread(target=self._run_loop, name="EspSerialReceiverThread", daemon=True)
        self._thread.start()
        print(f"[EspReceiver] Started receiver background thread targeting {self.port} @ {self.baud} baud.")

    def stop(self):
        self._running = False
        if self._ser and self._ser.is_open:
            try:
                self._ser.close()
            except Exception:
                pass
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        print("[EspReceiver] Receiver stopped.")

    def _read_exact(self, ser, size: int) -> bytes:
        data = bytearray()
        while len(data) < size and self._running:
            chunk = ser.read(size - len(data))
            if not chunk:
                raise TimeoutError(f"Serial timeout. Expected {size} bytes, got {len(data)}.")
            data.extend(chunk)
        return bytes(data)

    def _wait_for_magic(self, ser):
        buf = bytearray()
        line_buf = bytearray()
        while self._running:
            byte = ser.read(1)
            if not byte:
                continue

            buf += byte
            if len(buf) > len(MAGIC):
                buf.pop(0)

            if bytes(buf) == MAGIC:
                return

            line_buf += byte
            if byte == b'\n':
                try:
                    line = line_buf.decode("utf-8", errors="replace").rstrip()
                    if line:
                        print(f"[N8R8 Log] {line}")
                except Exception:
                    pass
                line_buf.clear()

    def _receive_one_image(self, ser) -> Optional[Path]:
        self._wait_for_magic(ser)
        if not self._running:
            return None

        print("[EspReceiver] Header GWIM found! Reading image size...")
        size_bytes = self._read_exact(ser, 4)
        image_size = struct.unpack("<I", size_bytes)[0]
        print(f"[EspReceiver] Incoming image size: {image_size} bytes")

        if image_size <= 0 or image_size > 10_000_000:
            raise ValueError(f"Invalid image size: {image_size}")

        ser.write(bytes([USB_READY]))
        ser.flush()

        image_data = bytearray()
        block_number = 0

        while len(image_data) < image_size and self._running:
            length_bytes = self._read_exact(ser, 2)
            block_length = struct.unpack("<H", length_bytes)[0]

            if block_length <= 0 or block_length > BLOCK_SIZE:
                raise ValueError(f"Invalid block size: {block_length}")

            block = self._read_exact(ser, block_length)
            image_data.extend(block)
            block_number += 1

            ser.write(bytes([USB_ACK]))
            ser.flush()

        if len(image_data) != image_size:
            raise ValueError(f"Size mismatch: expected {image_size}, received {len(image_data)}")

        # Check JPEG markers
        if image_data[:2] != b"\xFF\xD8" or image_data[-2:] != b"\xFF\xD9":
            raise ValueError("Invalid JPEG markers (missing SOI or EOI).")

        # CRC check
        crc_header = self._read_exact(ser, 1)
        if crc_header != b"C":
            raise ValueError("Expected CRC packet header 'C'.")

        crc_bytes = self._read_exact(ser, 4)
        n8_crc = struct.unpack("<I", crc_bytes)[0]
        pc_crc = zlib.crc32(image_data) & 0xFFFFFFFF

        if n8_crc != pc_crc:
            raise ValueError(f"CRC mismatch: N8R8=0x{n8_crc:08X}, PC=0x{pc_crc:08X}")

        self.output_dir.mkdir(parents=True, exist_ok=True)
        # Determine unique filename
        filename = self.output_dir / f"received_esp_{int(time.time())}_{self._counter:03d}.jpg"
        self._counter += 1

        with open(filename, "wb") as f:
            f.write(image_data)

        # Final ACK
        ser.write(bytes([USB_ACK]))
        ser.flush()

        # Validate decode
        try:
            with Image.open(filename) as img:
                img.load()
            print(f"[EspReceiver] Image successfully received & verified: {filename.name} ({image_size} bytes)")
        except Exception as e:
            print(f"[EspReceiver] Warning: Pillow decode error on {filename.name}: {e}")

        return filename

    def _find_active_port(self) -> str:
        try:
            import serial.tools.list_ports
            ports = list(serial.tools.list_ports.comports())
            if not ports:
                return self.port
            # 1. If configured port is connected, use it
            for p in ports:
                if p.device.upper() == self.port.upper():
                    return p.device
            # 2. Check for common ESP32/CH340/CP210 USB chips
            for p in ports:
                desc = f"{p.description or ''} {p.manufacturer or ''}".lower()
                if any(k in desc for k in ["ch340", "cp210", "usb", "serial", "ftdi", "esp", "uart"]):
                    print(f"[EspReceiver] Auto-detected ESP32 serial port: {p.device} ({p.description})")
                    return p.device
            # 3. If single port present, use it
            if len(ports) == 1:
                print(f"[EspReceiver] Single COM port detected: {ports[0].device}")
                return ports[0].device
        except Exception:
            pass
        return self.port

    def _run_loop(self):
        while self._running:
            target_port = self._find_active_port()
            try:
                print(f"[EspReceiver] Connecting to serial port {target_port} at {self.baud} baud...")
                with serial.Serial(target_port, self.baud, timeout=1) as ser:
                    self._ser = ser
                    print(f"[EspReceiver] Connected to {target_port}. Waiting for images from ESP32...")
                    time.sleep(1.0)
                    while self._running:
                        try:
                            self._receive_one_image(ser)
                        except (TimeoutError, ValueError) as proto_err:
                            print(f"[EspReceiver] Packet error: {proto_err}. Resetting buffer...")
                            try:
                                ser.reset_input_buffer()
                            except Exception:
                                pass
                            time.sleep(1.0)
            except Exception as conn_err:
                self._ser = None
                if self._running:
                    # Port not available or disconnected; sleep and retry periodically
                    print(f"[EspReceiver] {target_port} not available ({conn_err}). Retrying in 5 seconds...")
                    for _ in range(5):
                        if not self._running:
                            break
                        time.sleep(1.0)


# Global singleton instance
esp_receiver = EspSerialReceiver()
