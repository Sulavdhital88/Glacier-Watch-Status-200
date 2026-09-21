import io
import time
import queue
import threading
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms
from server.config import MODEL_PATH

CLASSES = ["DECREASING", "NORMAL", "RISING"]

# Preprocessing pipeline
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# For visual model-input (un-normalised 224x224 crop)
visual_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224)
])


class InferenceEngine:
    def __init__(self, model_path=None):
        self.model_path = model_path or MODEL_PATH
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.class_names = list(CLASSES)
        self._queue = queue.Queue()
        self._worker_thread = None
        self._running = False
        self._load_model()

    def _load_model(self):
        try:
            if self.model_path.exists():
                try:
                    ckpt = torch.load(self.model_path, map_location=self.device, weights_only=True)
                except Exception:
                    ckpt = torch.load(self.model_path, map_location=self.device, weights_only=False)

                if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
                    state_dict = ckpt["model_state_dict"]
                    if "class_names" in ckpt:
                        self.class_names = list(ckpt["class_names"])
                else:
                    state_dict = ckpt

                num_classes = len(self.class_names)
                model = models.mobilenet_v2(weights=None)
                model.classifier[1] = torch.nn.Linear(model.last_channel, num_classes)
                model.load_state_dict(state_dict)
                model.to(self.device)
                model.eval()
                self.model = model
                print(f"[InferenceEngine] Model successfully loaded from {self.model_path} onto {self.device} (classes: {self.class_names})")
            else:
                print(f"[InferenceEngine] Model file not found at {self.model_path}")
                self.model = None
        except Exception as e:
            print(f"[InferenceEngine] Error loading model: {e}")
            self.model = None

    def start_worker(self):
        self._running = True
        self._worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._worker_thread.start()

    def stop_worker(self):
        self._running = False
        self._queue.put(None)

    def _worker_loop(self):
        while self._running:
            try:
                task = self._queue.get()
                if task is None:
                    break
                image_path, result_holder, callback = task
                res = self.predict_sync(image_path)
                result_holder["result"] = res
                if callback:
                    try:
                        callback(res)
                    except Exception as cb_err:
                        print(f"[InferenceEngine] Callback error: {cb_err}")
                self._queue.task_done()
            except Exception as e:
                print(f"[InferenceEngine] Worker error: {e}")

    def predict_sync(self, image_path):
        """Run synchronous prediction on an image file"""
        start_time = time.time()
        try:
            with Image.open(image_path) as img:
                img_rgb = img.convert("RGB")
                tensor = transform(img_rgb).unsqueeze(0).to(self.device)

            if self.model is None:
                self._load_model()

            with torch.no_grad():
                outputs = self.model(tensor)
                probs = F.softmax(outputs, dim=1)[0].cpu().numpy()

            inference_ms = max(1, int((time.time() - start_time) * 1000))
            prob_dict = {
                self.class_names[i]: float(probs[i])
                for i in range(len(self.class_names))
            }
            top_idx = int(probs.argmax())
            top_label = self.class_names[top_idx]
            confidence = float(probs[top_idx])

            return {
                "label": top_label,
                "confidence": round(confidence, 4),
                "probabilities": {k: round(v, 4) for k, v in prob_dict.items()},
                "inference_ms": inference_ms
            }
        except Exception as e:
            print(f"[InferenceEngine] Prediction failed for {image_path}: {e}")
            return {
                "label": "NORMAL",
                "confidence": 0.3333,
                "probabilities": {"DECREASING": 0.3333, "NORMAL": 0.3334, "RISING": 0.3333},
                "inference_ms": int((time.time() - start_time) * 1000)
            }

    def generate_model_input_image_bytes(self, image_path) -> bytes:
        """Returns the exact 224x224 cropped image the classifier sees (un-normalised) as JPEG bytes"""
        with Image.open(image_path) as img:
            cropped = visual_transform(img.convert("RGB"))
            buf = io.BytesIO()
            cropped.save(buf, format="JPEG", quality=90)
            return buf.getvalue()


# Global engine instance
inference_engine = InferenceEngine()
