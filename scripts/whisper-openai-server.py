#!/usr/bin/env python3
"""OpenAI-compatible Whisper STT server backed by faster-whisper (real inference)."""

from __future__ import annotations

import io
import os
import tempfile
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import uvicorn

MODEL_NAME = os.environ.get("WHISPER_MODEL", "tiny")
HOST = os.environ.get("WHISPER_HOST", "127.0.0.1")
PORT = int(os.environ.get("WHISPER_PORT", "8090"))

app = FastAPI(title="Bao Whisper STT")
_model: Optional[WhisperModel] = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")
    return _model


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": MODEL_NAME}


@app.get("/v1/models")
def list_models() -> dict[str, object]:
    return {
        "object": "list",
        "data": [{"id": f"whisper-{MODEL_NAME}", "object": "model", "owned_by": "faster-whisper"}],
    }


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-tiny"),
    language: Optional[str] = Form(default=None),
) -> JSONResponse:
    del model  # OpenAI compat field; runtime model is WHISPER_MODEL.
    raw = await file.read()
    if len(raw) == 0:
        return JSONResponse({"error": {"message": "empty audio"}}, status_code=400)

    suffix = ".webm"
    filename = file.filename or "audio.webm"
    if "." in filename:
        suffix = f".{filename.rsplit('.', 1)[-1]}"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(raw)
        tmp.flush()
        segments, _info = get_model().transcribe(
            tmp.name,
            language=language,
            vad_filter=True,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()

    return JSONResponse({"text": text})


if __name__ == "__main__":
    # Warm model before accept so first demo call is not a cold download.
    get_model()
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
