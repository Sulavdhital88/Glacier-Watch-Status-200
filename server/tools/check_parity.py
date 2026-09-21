"""
GlacierWatch Model Parity Checker
Compares predictions between scripts/predict.py and server/inference.py across all images in received_images/.
Fails with non-zero exit code if any probability differs by > 0.005.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from scripts.predict import load_model as ref_load_model, predict_image as ref_predict
from server.inference import InferenceEngine
from server.config import RECEIVED_IMAGES_DIR, MODEL_PATH


def check_parity():
    print("=" * 60)
    print("GlacierWatch Parity Checker")
    print(f"Checking images in: {RECEIVED_IMAGES_DIR}")
    print("=" * 60)

    if not RECEIVED_IMAGES_DIR.exists():
        print(f"Error: Directory {RECEIVED_IMAGES_DIR} does not exist.")
        sys.exit(1)

    images = list(RECEIVED_IMAGES_DIR.glob("*.jpg")) + list(RECEIVED_IMAGES_DIR.glob("*.jpeg"))
    if not images:
        print(f"Warning: No JPEG images found in {RECEIVED_IMAGES_DIR}.")
        sys.exit(0)

    # Load reference model
    ref_model, ref_dev = ref_load_model(str(MODEL_PATH))
    # Load server engine
    server_engine = InferenceEngine(MODEL_PATH)

    max_diff = 0.0
    parity_failed = False

    for img_path in sorted(images):
        ref_res = ref_predict(str(img_path), ref_model, ref_dev)
        srv_res = server_engine.predict_sync(str(img_path))

        print(f"\nImage: {img_path.name}")
        print(f"  Reference Label: {ref_res['label']} ({ref_res['confidence']:.4f})")
        print(f"  Server    Label: {srv_res['label']} ({srv_res['confidence']:.4f})")

        for cls in ["DECREASING", "NORMAL", "RISING"]:
            ref_p = ref_res["probabilities"][cls]
            srv_p = srv_res["probabilities"][cls]
            diff = abs(ref_p - srv_p)
            max_diff = max(max_diff, diff)
            print(f"    Class {cls:<10}: Ref={ref_p:.4f}, Srv={srv_p:.4f}, Diff={diff:.5f}")
            if diff > 0.005:
                print(f"    [FAIL] Difference {diff:.5f} exceeds threshold 0.005!")
                parity_failed = True

    print("\n" + "=" * 60)
    print(f"Max observed probability difference: {max_diff:.6f}")
    if parity_failed:
        print("[FAIL] Parity check failed!")
        sys.exit(1)
    else:
        print("[PASS] Parity check passed within tolerance (<= 0.005).")
        sys.exit(0)


if __name__ == "__main__":
    check_parity()
