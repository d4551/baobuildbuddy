#!/usr/bin/env python3
"""
Shared NDJSON protocol emitter for Python scraper and RPA scripts.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

PROTOCOL_VERSION = "1.0"
MAX_MESSAGE_LENGTH = 2000


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_payload(payload: dict[str, Any]) -> str:
    """Serialize a protocol payload deterministically."""
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


@dataclass
class ProtocolEmitter:
    """Emit protocol-compliant events for RPA execution streams."""

    run_id: str
    sequence: int = field(default=0, init=False)

    def _event_base(self, event_type: str) -> dict[str, Any]:
        event = {
            "protocolVersion": PROTOCOL_VERSION,
            "runId": self.run_id,
            "sequence": self.sequence,
            "timestamp": _now_iso(),
            "eventType": event_type,
        }
        self.sequence += 1
        return event

    def emit_progress(self, event: dict[str, Any]) -> None:
        payload = self._event_base("progress")
        payload.update(event)
        sys.stderr.write(f"{serialize_payload(payload)}\n")
        sys.stderr.flush()

    def emit_result(self, event: dict[str, Any]) -> None:
        payload = self._event_base("result")
        payload["result"] = event
        sys.stdout.write(f"{serialize_payload(payload)}\n")
        sys.stdout.flush()

    def emit_error(self, code: str, message: str, details: dict[str, Any] | None = None) -> None:
        payload = self._event_base("error")
        safe_message = message.strip()[:MAX_MESSAGE_LENGTH] if message else "Unknown error"
        payload["error"] = {
            "code": code,
            "message": safe_message,
            "source": "python-script",
            **({"details": details} if details else {}),
        }
        sys.stdout.write(f"{serialize_payload(payload)}\n")
        sys.stdout.flush()
