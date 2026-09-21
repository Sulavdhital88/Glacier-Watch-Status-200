"""
GlacierWatch Reference Inference Script
Three-class classifier for glacial lake visual state: DECREASING, NORMAL, RISING.
Model: MobileNetV2
Preprocessing: Resize(256, 256) -> CenterCrop(224) -> ToTensor() -> Normalize(mean, std)
"""

import sys
import time
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms

CLASSES = ["DECREASING", "NORMAL", "RISING"]

# Standard ImageNet normalization and resize/centercrop
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def load_model(model_path="models/glacierwatch_model.pth", device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    try:
        ckpt = torch.load(model_path, map_location=device, weights_only=True)
    except Exception:
        ckpt = torch.load(model_path, map_location=device, weights_only=False)

    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        state_dict = ckpt["model_state_dict"]
    else:
        state_dict = ckpt

    model = models.mobilenet_v2(weights=None)
    model.classifier[1] = torch.nn.Linear(model.last_channel, 3)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model, device


def predict_image(image_path, model, device):
    start_time = time.time()
    with Image.open(image_path) as img:
        img_rgb = img.convert("RGB")
        tensor = transform(img_rgb).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1)[0].cpu().numpy()

    inference_ms = int((time.time() - start_time) * 1000)
    prob_dict = {
        CLASSES[i]: float(probs[i])
        for i in range(len(CLASSES))
    }
    top_idx = int(probs.argmax())
    top_label = CLASSES[top_idx]
    confidence = float(probs[top_idx])

    return {
        "label": top_label,
        "confidence": round(confidence, 4),
        "probabilities": {k: round(v, 4) for k, v in prob_dict.items()},
        "inference_ms": inference_ms
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path> [model_path]")
        sys.exit(1)
    img_p = sys.argv[1]
    m_p = sys.argv[2] if len(sys.argv) > 2 else "models/glacierwatch_model.pth"
    m, dev = load_model(m_p)
    res = predict_image(img_p, m, dev)
    print(res)
