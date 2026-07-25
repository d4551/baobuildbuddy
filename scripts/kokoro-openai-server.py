#!/usr/bin/env python3
"""
Local Kokoro TTS — OpenAI-compatible POST /v1/audio/speech (on-device ONNX).
Env:
  KOKORO_HOST (default 127.0.0.1)
  KOKORO_PORT (default 8880)
  KOKORO_MODEL_PATH (default ~/.bao/kokoro/kokoro-v1.0.onnx)
  KOKORO_VOICES_PATH (default ~/.bao/kokoro/voices-v1.0.bin)
"""
from __future__ import annotations

import io
import json
import os
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import numpy as np
from kokoro_onnx import Kokoro

HOST = os.environ.get("KOKORO_HOST", "127.0.0.1")
PORT = int(os.environ.get("KOKORO_PORT", "8880"))
MODEL_PATH = Path(
    os.environ.get("KOKORO_MODEL_PATH", str(Path.home() / ".bao/kokoro/kokoro-v1.0.onnx"))
).expanduser()
VOICES_PATH = Path(
    os.environ.get("KOKORO_VOICES_PATH", str(Path.home() / ".bao/kokoro/voices-v1.0.bin"))
).expanduser()
DEFAULT_VOICE = os.environ.get("KOKORO_DEFAULT_VOICE", "af_heart")

kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
VOICES = list(kokoro.get_voices())


def pcm_to_wav(samples: np.ndarray, sample_rate: int) -> bytes:
    clipped = np.clip(samples, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm.tobytes())
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print(f"[kokoro-tts] {self.address_string()} - {fmt % args}")

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self._send(status, raw, "application/json")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/health", "/v1/health"):
            self._send_json(
                200,
                {
                    "status": "ok",
                    "engine": "kokoro-onnx",
                    "voices": len(VOICES),
                    "model": str(MODEL_PATH),
                },
            )
            return
        if path == "/v1/models":
            self._send_json(
                200,
                {
                    "object": "list",
                    "data": [
                        {"id": "kokoro", "object": "model", "owned_by": "local"},
                        *[
                            {"id": voice, "object": "model", "owned_by": "kokoro"}
                            for voice in VOICES
                        ],
                    ],
                },
            )
            return
        self._send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path != "/v1/audio/speech":
            self._send_json(404, {"error": "not_found"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "invalid_json"})
            return
        text = str(body.get("input") or "").strip()
        if len(text) == 0:
            self._send_json(400, {"error": "input_required"})
            return
        voice = str(body.get("voice") or DEFAULT_VOICE)
        if voice not in VOICES:
            voice = DEFAULT_VOICE if DEFAULT_VOICE in VOICES else VOICES[0]
        speed = float(body.get("speed") or 1.0)
        samples, sample_rate = kokoro.create(text, voice=voice, speed=speed)
        fmt = str(body.get("response_format") or "wav").lower()
        if fmt != "wav":
            # Keep wiring honest: WAV only in this lightweight server (no ffmpeg).
            fmt = "wav"
        audio = pcm_to_wav(np.asarray(samples, dtype=np.float32), int(sample_rate))
        self._send(200, audio, "audio/wav")


def main() -> None:
    if not MODEL_PATH.is_file() or not VOICES_PATH.is_file():
        raise SystemExit(
            f"Kokoro model files missing. Expected:\n  {MODEL_PATH}\n  {VOICES_PATH}"
        )
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[kokoro-tts] listening on http://{HOST}:{PORT}/v1 (voices={len(VOICES)})")
    server.serve_forever()


if __name__ == "__main__":
    main()
