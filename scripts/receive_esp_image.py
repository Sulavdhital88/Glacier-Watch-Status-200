"""
Standalone ESP32-S3 Serial Image Receiver CLI
Receives images over USB from ESP32-S3 (N8R8) and saves directly to Sunway_hackathon/received_images.
"""

import sys
import os
import argparse
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from server.config import SERIAL_PORT, SERIAL_BAUD, RECEIVED_IMAGES_DIR
from server.esp_receiver import EspSerialReceiver

def main():
    parser = argparse.ArgumentParser(description="GlacierWatch ESP32 Image Receiver")
    parser.add_argument("--port", default=SERIAL_PORT, help=f"Serial COM port (default: {SERIAL_PORT})")
    parser.add_argument("--baud", type=int, default=SERIAL_BAUD, help=f"Baud rate (default: {SERIAL_BAUD})")
    parser.add_argument("--output", default=str(RECEIVED_IMAGES_DIR), help=f"Output directory (default: {RECEIVED_IMAGES_DIR})")
    args = parser.parse_args()

    print("=" * 60)
    print("GLACIERWATCH ESP32 SERIAL IMAGE RECEIVER")
    print(f"Port:   {args.port}")
    print(f"Baud:   {args.baud}")
    print(f"Target: {args.output}")
    print("=" * 60)

    receiver = EspSerialReceiver(port=args.port, baud=args.baud, output_dir=Path(args.output))
    try:
        receiver.start()
        print("Receiver running. Press Ctrl+C to stop.")
        while True:
            import time
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nStopping receiver...")
        receiver.stop()
        print("Stopped.")

if __name__ == "__main__":
    main()
