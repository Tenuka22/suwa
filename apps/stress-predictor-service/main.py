import tensorflow as tf
import numpy as np
import os
from fastapi import Depends, FastAPI, HTTPException, Header
from pydantic import BaseModel
import uvicorn
from typing import Annotated

N_FEATURES = 11
SEQUENCE_LENGTHS = [120, 240, 360]

MODELS = {
    seq_len: tf.keras.models.load_model(
        os.path.join("../../apps/model-trainer/models", f"seq_{seq_len}", "model.keras")
    )
    for seq_len in SEQUENCE_LENGTHS
}

app = FastAPI()

class PredictionRequest(BaseModel):
    window_samples: list[float]

class PredictionResponseItem(BaseModel):
    prediction: str
    probabilities: list[float]

class PredictionResponse(BaseModel):
    results: dict[str, PredictionResponseItem]

CLASSES = ["baseline", "amusement", "stress"]

API_KEY = os.getenv("STRESS_PREDICTOR_SECRET")

async def verify_api_key(x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None):
    if not API_KEY:
        return
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, auth: Annotated[None, Depends(verify_api_key)] = None):
    n = len(request.window_samples)
    if n % N_FEATURES != 0:
        raise HTTPException(status_code=400, detail=f"window_samples length ({n}) must be a multiple of {N_FEATURES}")

    seq_len = n // N_FEATURES
    samples = np.array(request.window_samples, dtype=np.float32).reshape(1, seq_len, N_FEATURES)

    results = {}

    p_list = []
    for model_len in SEQUENCE_LENGTHS:
        if seq_len >= model_len:
            data = samples[:, -model_len:, :]
            probs = MODELS[model_len].predict(data, verbose=0)[0]
            idx = int(np.argmax(probs))
            results[str(model_len)] = PredictionResponseItem(
                prediction=CLASSES[idx],
                probabilities=probs.tolist(),
            )
            p_list.append(probs)

    if p_list:
        avg_probs = np.mean(p_list, axis=0)
        idx = int(np.argmax(avg_probs))
        results["0"] = PredictionResponseItem(
            prediction=CLASSES[idx],
            probabilities=avg_probs.tolist(),
        )

    return PredictionResponse(results=results)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=50051)
