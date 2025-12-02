
import os
import io
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any

import torch
import torch.nn as nn
import torchvision.transforms as T
from torchvision import models
from PIL import Image

from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUNS_DIR = os.path.join(BASE_DIR, "runs")
MODELS_DIR = os.path.join(BASE_DIR, "models")
CLASS_MAP_PATH = os.path.join(BASE_DIR, "class_indices.json")
WEIGHTS_PATH = os.path.join(MODELS_DIR, "250910resnet18_dogs_weights.pth")

os.makedirs(RUNS_DIR, exist_ok=True)

app = FastAPI(title="Dog Breed Classifier")

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

NUM_CLASSES = 120

def load_class_mapping() -> Dict[int, str]:
    """Load class index -> breed name mapping from class_indices.json.

    JSON format:
    {
      "0": "beagle",
      "1": "chihuahua",
      ...
    }
    """
    if not os.path.exists(CLASS_MAP_PATH):
        return {i: f"class_{i}" for i in range(NUM_CLASSES)}
    with open(CLASS_MAP_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    mapping: Dict[int, str] = {}
    for k, v in raw.items():
        try:
            idx = int(k)
            mapping[idx] = str(v)
        except ValueError:
            continue
    for i in range(NUM_CLASSES):
        if i not in mapping:
            mapping[i] = f"class_{i}"
    return mapping

CLASS_MAPPING = load_class_mapping()

def build_model() -> nn.Module:
    model = models.resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, NUM_CLASSES)

    if not os.path.exists(WEIGHTS_PATH):
        raise RuntimeError(
            f"Model weights not found at {WEIGHTS_PATH}. "
            "Put your trained weights file there."
        )

    state = torch.load(WEIGHTS_PATH, map_location="cpu")

    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    if isinstance(state, dict):
        cleaned = {}
        for k, v in state.items():
            key = k
            if key.startswith("module."):
                key = key[len("module.") :]
            if key.startswith("model."):
                key = key[len("model.") :]
            cleaned[key] = v
        state = cleaned

    model.load_state_dict(state, strict=False)
    model.eval()
    model.to(device)
    return model

model: nn.Module | None = None

def get_model() -> nn.Module:
    global model
    if model is None:
        model = build_model()
    return model

transform = T.Compose(
    [
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)

def create_run_dir() -> str:
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_id = str(uuid.uuid4())[:8]
    run_id = f"{now}_{short_id}"
    run_path = os.path.join(RUNS_DIR, run_id)
    os.makedirs(run_path, exist_ok=True)
    return run_id

def save_uploaded_image(run_id: str, file: UploadFile, content: bytes) -> str:
    run_path = os.path.join(RUNS_DIR, run_id)
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
        ext = ".jpg"
    save_path = os.path.join(run_path, f"input{ext}")
    with open(save_path, "wb") as f:
        f.write(content)
    return save_path

def run_inference(image_bytes: bytes) -> List[Dict[str, Any]]:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    x = transform(img).unsqueeze(0).to(device)

    m = get_model()
    with torch.no_grad():
        logits = m(x)
        probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

    top_indices = probs.argsort()[-3:][::-1]
    results: List[Dict[str, Any]] = []
    for idx in top_indices:
        label = CLASS_MAPPING.get(int(idx), f"class_{idx}")
        prob = float(probs[idx])
        results.append(
            {
                "index": int(idx),
                "label": label,
                "prob": prob,
                "percent": round(prob * 100, 2),
            }
        )
    return results

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file is None:
        raise HTTPException(status_code=400, detail="이미지 파일이 필요합니다.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="비어 있는 파일입니다.")

    run_id = create_run_dir()
    saved_path = save_uploaded_image(run_id, file, content)

    try:
        top3 = run_inference(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 추론 중 오류 발생: {e}")

    meta = {
        "run_id": run_id,
        "image_path": saved_path,
        "top3": top3,
        "created_at": datetime.now().isoformat(),
    }
    meta_path = os.path.join(RUNS_DIR, run_id, "result.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    top1_prob = top3[0]["prob"] if top3 else 0.0
    needs_retry = top1_prob < 0.60

    return JSONResponse(
        {
            "run_id": run_id,
            "top3": top3,
            "needs_retry": needs_retry,
        }
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
