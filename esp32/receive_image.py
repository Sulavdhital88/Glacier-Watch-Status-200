import serial
import struct
import time
import os
import zlib
from PIL import Image

# ============================================================
# SETTINGS
# ============================================================

PORT = "COM4"
BAUD = 2000000

# Direct images automatically to Sunway Hackathon console received_images directory
DEFAULT_SUNWAY_DIR = r"C:\Users\lenovo\Desktop\Sunway_hackathon\Sunway_hackathon\received_images"
OUTPUT_DIR = DEFAULT_SUNWAY_DIR if os.path.exists(r"C:\Users\lenovo\Desktop\Sunway_hackathon\Sunway_hackathon") else "received_images"

MAGIC = b"GWIM"

USB_READY = 0x52
USB_ACK = 0x41

BLOCK_SIZE = 32768

# ============================================================
# SERIAL OUTPUT
# ============================================================

def print_serial_output(ser, duration=2.0):
    start = time.time()
    while time.time() - start < duration:
        if ser.in_waiting:
            try:
                line = ser.readline().decode("utf-8", errors="replace").rstrip()
                if line:
                    print("[N8R8]", line)
            except Exception:
                pass
        else:
            time.sleep(0.01)

# ============================================================
# READ EXACT
# ============================================================

def read_exact(ser, size):
    data = bytearray()
    while len(data) < size:
        chunk = ser.read(size - len(data))
        if not chunk:
            raise TimeoutError(f"Serial timeout. Expected {size} bytes, got {len(data)}.")
        data.extend(chunk)
    return bytes(data)

# ============================================================
# WAIT FOR MAGIC (AND PRINT LOGS)
# ============================================================

def wait_for_magic(ser):
    buffer = bytearray()
    line_buf = bytearray()
    
    while True:
        byte = ser.read(1)
        if not byte:
            continue
            
        buffer += byte
        if len(buffer) > len(MAGIC):
            buffer.pop(0)
            
        if bytes(buffer) == MAGIC:
            return
            
        line_buf += byte
        if byte == b'\n':
            try:
                line = line_buf.decode("utf-8", errors="replace").rstrip()
                if line:
                    print("[N8R8]", line)
            except Exception:
                pass
            line_buf.clear()

# ============================================================
# JPEG VALIDATION
# ============================================================

def verify_jpeg(filename):
    print("\n[PC-JPEG] VERIFYING JPEG")
    try:
        with Image.open(filename) as img:
            print("Format:", img.format)
            print("Size:", img.size)
            print("Mode:", img.mode)
            img.load()
        print("[PC-JPEG] FULL DECODE: OK")
        return True
    except Exception as e:
        print("[PC-JPEG] DECODE FAILED:", e)
        return False

# ============================================================
# RECEIVE ONE IMAGE
# ============================================================

def receive_image(ser, image_number):
    print("\n================================")
    print("WAITING FOR JPEG")
    print("================================")

    wait_for_magic(ser)
    print("[PC-USB] IMAGE HEADER FOUND!")

    size_bytes = read_exact(ser, 4)
    image_size = struct.unpack("<I", size_bytes)[0]
    print(f"[PC-USB] Expected JPEG size: {image_size} bytes")

    if image_size <= 0 or image_size > 5_000_000:
        raise ValueError("Invalid image size.")

    print("[PC-USB] Sending READY to N8R8...")
    ser.write(bytes([USB_READY]))
    ser.flush()

    print("[PC-USB] Receiving JPEG...")
    image_data = bytearray()
    block_number = 0

    while len(image_data) < image_size:
        length_bytes = read_exact(ser, 2)
        block_length = struct.unpack("<H", length_bytes)[0]

        if block_length <= 0 or block_length > BLOCK_SIZE:
            raise ValueError(f"Invalid block size: {block_length}")

        block = read_exact(ser, block_length)
        image_data.extend(block)
        block_number += 1

        ser.write(bytes([USB_ACK]))
        ser.flush()

        if block_number == 1 or len(image_data) >= image_size or block_number % 20 == 0:
            print(f"[PC-USB] Received {len(image_data)}/{image_size} bytes")

    if len(image_data) != image_size:
        raise ValueError(f"IMAGE SIZE MISMATCH! Expected: {image_size} Received: {len(image_data)}")

    print("\n[PC-JPEG] Checking JPEG markers...")
    if image_data[:2] != b"\xFF\xD8":
        raise ValueError("JPEG START MARKER INVALID!")
    if image_data[-2:] != b"\xFF\xD9":
        raise ValueError("JPEG END MARKER INVALID!")
    print("[PC-JPEG] START: OK, END: OK")

    print("\n[PC-CRC] Waiting for N8R8 CRC...")
    crc_header = read_exact(ser, 1)
    if crc_header != b"C":
        raise ValueError("Expected CRC packet.")

    crc_bytes = read_exact(ser, 4)
    n8_crc = struct.unpack("<I", crc_bytes)[0]
    pc_crc = zlib.crc32(image_data) & 0xFFFFFFFF

    print(f"[PC-CRC] N8R8 CRC32: 0x{n8_crc:08X}")
    print(f"[PC-CRC] PC CRC32:   0x{pc_crc:08X}")

    if n8_crc != pc_crc:
        raise ValueError("USB CRC mismatch.")
    print("[PC-CRC] OK")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = os.path.join(OUTPUT_DIR, f"received_{image_number:03d}.jpg")
    with open(filename, "wb") as f:
        f.write(image_data)
    print(f"\n[PC-USB] Saved: {filename}")

    ser.write(bytes([USB_ACK]))
    ser.flush()

    verify_jpeg(filename)
    return filename

# ============================================================
# MAIN
# ============================================================

def main():
    print("\n================================")
    print("GLACIERWATCH USB IMAGE RECEIVER")
    print("================================")
    
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
    except Exception as e:
        print("Could not open serial port:", e)
        return

    time.sleep(2)
    print_serial_output(ser, duration=2.0)
    
    image_number = 1

    try:
        while True:
            try:
                receive_image(ser, image_number)
                image_number += 1
                print("\n[PC-USB] Ready for next image.")
            except KeyboardInterrupt:
                break
            except Exception as e:
                print("\nERROR:", e)
                ser.reset_input_buffer()
                time.sleep(5)
                print_serial_output(ser, duration=1.0)
    finally:
        ser.close()
        print("Serial port closed.")

if __name__ == "__main__":
    main()