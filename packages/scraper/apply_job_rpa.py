#!/usr/bin/env python3
"""
Apply a job application using RPA-Python with contract-first NDJSON I/O.

- Progress events are emitted to stderr.
- One terminal result (or error) event is emitted to stdout.
- Artifacts are written into `outputDir` supplied by the caller.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

from _protocol import ProtocolEmitter

r: Any

ALLOWED_BROWSERS = {"chrome", "chromium", "edge"}
TOTAL_STEPS = 10


def load_rpa_module() -> Any | None:
    try:
        import rpa as module
    except ImportError:
        return None
    return module


def read_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    return json.loads(raw)


def ensure_output_dir(payload: dict[str, Any], run_id: str) -> str:
    output_dir = payload.get("outputDir")
    if isinstance(output_dir, str) and output_dir.strip():
        target = Path(output_dir.strip())
    else:
        target = Path(tempfile.mkdtemp(prefix=f"bao-rpa-{run_id}-"))
    target.mkdir(parents=True, exist_ok=True)
    return str(target.resolve())


def field_candidates(value: Any, keys: list[str]) -> list[str]:
    if not isinstance(value, dict):
        return []
    values: list[str] = []
    for key in keys:
        candidate = value.get(key)
        if isinstance(candidate, str) and candidate.strip():
            values.append(candidate.strip())
    return values


def collect_candidates(resume: dict[str, Any]) -> dict[str, str]:
    personal_info_raw = resume.get("personalInfo")
    personal_info = personal_info_raw if isinstance(personal_info_raw, dict) else {}
    full_name = field_candidates(personal_info, ["fullName", "name", "full_name", "firstName"])
    email = field_candidates(personal_info, ["email", "emailAddress"])
    phone = field_candidates(personal_info, ["phone", "phoneNumber", "mobile"])
    return {
        "fullName": full_name[0] if full_name else "",
        "email": email[0] if email else "",
        "phone": phone[0] if phone else "",
    }


def present_any(selectors: list[str]) -> str | None:
    for selector in selectors:
        try:
            if r.present(selector):
                return selector
        except Exception:
            continue
    return None


def type_if_available(selectors: list[str], text: str) -> bool:
    for selector in selectors:
        try:
            if r.present(selector):
                r.type(selector, text)
                return True
        except Exception:
            continue
    return False


def click_if_available(selectors: list[str]) -> bool:
    for selector in selectors:
        try:
            if r.present(selector):
                r.click(selector)
                return True
        except Exception:
            continue
    return False


def select_if_available(selectors: list[str], value: str) -> bool:
    for selector in selectors:
        try:
            if r.present(selector):
                r.select(selector, value)
                return True
        except Exception:
            continue
    return False


def upload_if_available(selectors: list[str], file_path: str) -> bool:
    for selector in selectors:
        try:
            if r.present(selector):
                r.upload(selector, file_path)
                return True
        except Exception:
            continue
    return False


def get_form_fields_via_dom() -> list[dict[str, str]]:
    try:
        js_code = (
            "return JSON.stringify("
            "Array.from(document.querySelectorAll('input,textarea,select')).map(e=>({"
            "tag:e.tagName,type:e.type||'',name:e.name||'',id:e.id||'',"
            "label:(e.labels&&e.labels[0])?e.labels[0].textContent.trim():''"
            "})))"
        )
        r.dom(js_code)
        result = r.dom_result
        if isinstance(result, str) and result.strip():
            loaded = json.loads(result)
            return loaded if isinstance(loaded, list) else []
    except Exception:
        return []
    return []


def verify_submission() -> bool:
    try:
        page_text = r.read("page")
        if isinstance(page_text, str):
            lower = page_text.lower()
            confirmation_phrases = [
                "thank you",
                "application received",
                "application submitted",
                "successfully submitted",
                "we received your application",
                "application complete",
                "submission confirmed",
            ]
            return any(phrase in lower for phrase in confirmation_phrases)
    except Exception:
        return False
    return False


def init_browser(headless: bool, timeout: int, browser: str) -> None:
    base_kwargs = {"turbo_mode": True, "headless_mode": headless}
    preferred_kwargs = dict(base_kwargs)
    if browser:
        preferred_kwargs["browser"] = browser

    try:
        r.init(**preferred_kwargs)
    except TypeError:
        r.init(**base_kwargs)

    r.timeout(timeout)


def add_step(steps: list[dict[str, Any]], action: str, status: str, message: str | None = None) -> None:
    entry: dict[str, Any] = {"action": action, "status": status}
    if message:
        entry["message"] = message
    steps.append(entry)


def create_artifacts(screenshots: list[str]) -> list[dict[str, str]]:
    return [
        {
            "id": f"screenshot-{index + 1:02d}",
            "kind": "screenshot",
            "path": path,
        }
        for index, path in enumerate(screenshots)
    ]


def main() -> int:
    payload = read_payload()
    run_id_raw = payload.get("runId")
    run_id = run_id_raw.strip() if isinstance(run_id_raw, str) and run_id_raw.strip() else "run-missing-id"
    emitter = ProtocolEmitter(run_id=run_id)

    module = load_rpa_module()
    if module is None:
        emitter.emit_error("PYTHON_RUNTIME_ERROR", "RPA not installed. pip install rpa")
        return 1
    global r
    r = module

    job_url = payload.get("jobUrl")
    resume = payload.get("resume")
    if not isinstance(job_url, str) or not job_url.strip():
        emitter.emit_error("OUTPUT_VALIDATION_ERROR", "Missing jobUrl")
        return 1
    if not isinstance(resume, dict):
        emitter.emit_error("OUTPUT_VALIDATION_ERROR", "Missing resume payload")
        return 1

    candidates = collect_candidates(resume)
    output_dir = ensure_output_dir(payload, run_id)
    screenshots: list[str] = []
    steps: list[dict[str, Any]] = []
    selector_map = payload.get("selectorMap")
    selectors = selector_map if isinstance(selector_map, dict) else {}
    custom_answers_raw = payload.get("customAnswers")
    custom_answers = custom_answers_raw if isinstance(custom_answers_raw, dict) else {}

    settings_raw = payload.get("settings")
    settings = settings_raw if isinstance(settings_raw, dict) else {}
    headless = bool(settings.get("headless", True))
    timeout = int(settings.get("defaultTimeout", 30)) if isinstance(settings.get("defaultTimeout"), (int, float)) else 30
    auto_screenshots = bool(settings.get("autoSaveScreenshots", True))
    browser_raw = settings.get("defaultBrowser")
    browser = browser_raw.strip().lower() if isinstance(browser_raw, str) and browser_raw.strip() else "chrome"
    if browser not in ALLOWED_BROWSERS:
        browser = "chrome"

    step_number = 0

    def emit_progress(action: str, message: str | None = None, status: str = "running") -> None:
        emitter.emit_progress(
            {
                "action": action,
                "status": status,
                "step": step_number,
                "totalSteps": TOTAL_STEPS,
                **({"message": message} if message else {}),
            }
        )

    def snap(label: str) -> None:
        if not auto_screenshots:
            return
        path = os.path.join(output_dir, f"step-{len(screenshots) + 1:02d}.png")
        try:
            r.snap("page", path)
            screenshots.append(path)
            add_step(steps, "screenshot", "ok", label)
        except Exception:
            add_step(steps, "screenshot", "error", "Failed to capture screenshot")

    try:
        step_number += 1
        emit_progress("init_browser")
        init_browser(headless, timeout if timeout > 0 else 30, browser)
        add_step(steps, "init", "ok", f"headless={headless}, timeout={timeout}s")

        step_number += 1
        emit_progress("navigate")
        r.url(job_url.strip())
        r.wait(2)
        add_step(steps, "navigate", "ok", f"Loaded {job_url.strip()}")
        snap("Loaded job page")

        step_number += 1
        emit_progress("detect_fields")
        form_fields = get_form_fields_via_dom()
        add_step(steps, "detect_fields", "ok", f"Detected {len(form_fields)} form fields")

        name_selectors = (selectors.get("fullName", []) if isinstance(selectors.get("fullName"), list) else []) + [
            "input[name='fullName']",
            "input[name='name']",
            "input[name='first_name']",
            "input[name='firstName']",
        ]
        email_selectors = (selectors.get("email", []) if isinstance(selectors.get("email"), list) else []) + [
            "input[type='email']",
            "input[name='email']",
        ]
        phone_selectors = (selectors.get("phone", []) if isinstance(selectors.get("phone"), list) else []) + [
            "input[type='tel']",
            "input[name='phone']",
        ]
        resume_selectors = (selectors.get("resume", []) if isinstance(selectors.get("resume"), list) else []) + [
            "input[type='file']",
            "input[name='resume']",
            "input[name='cv']",
        ]
        cover_letter_selectors = (
            selectors.get("coverLetter", []) if isinstance(selectors.get("coverLetter"), list) else []
        ) + [
            "textarea[name='cover_letter']",
            "textarea[name='coverLetter']",
        ]
        submit_selectors = (selectors.get("submit", []) if isinstance(selectors.get("submit"), list) else []) + [
            "button[type='submit']",
            "input[type='submit']",
        ]

        step_number += 1
        emit_progress("fill_name")
        if candidates["fullName"] and type_if_available(name_selectors, candidates["fullName"]):
            add_step(steps, "fill_name", "ok")
        else:
            add_step(steps, "fill_name", "error", "Name field not found")

        step_number += 1
        emit_progress("fill_email")
        if candidates["email"] and type_if_available(email_selectors, candidates["email"]):
            add_step(steps, "fill_email", "ok")
        else:
            add_step(steps, "fill_email", "error", "Email field not found")

        step_number += 1
        emit_progress("fill_phone")
        if candidates["phone"] and type_if_available(phone_selectors, candidates["phone"]):
            add_step(steps, "fill_phone", "ok")
        else:
            add_step(steps, "fill_phone", "error", "Phone field not found")

        step_number += 1
        emit_progress("upload_resume")
        if present_any(resume_selectors):
            resume_path = os.path.join(output_dir, "resume.json")
            with open(resume_path, "w", encoding="utf-8") as handle:
                handle.write(json.dumps(resume, ensure_ascii=False, indent=2))
            if upload_if_available(resume_selectors, resume_path):
                add_step(steps, "upload_resume", "ok")
            else:
                add_step(steps, "upload_resume", "error", "Resume upload failed")
        else:
            add_step(steps, "upload_resume", "ok", "No file input found")

        cover_letter = payload.get("coverLetter")
        if isinstance(cover_letter, dict):
            content = cover_letter.get("content")
            if isinstance(content, dict):
                text = "\n\n".join(
                    [
                        str(content.get("introduction", "")),
                        str(content.get("body", "")),
                        str(content.get("conclusion", "")),
                    ]
                ).strip()
                if text:
                    if type_if_available(cover_letter_selectors, text):
                        add_step(steps, "fill_cover_letter", "ok")
                    else:
                        add_step(steps, "fill_cover_letter", "error", "Cover letter field not found")

        step_number += 1
        emit_progress("fill_custom_fields")
        for key, value in custom_answers.items():
            if not isinstance(key, str) or not isinstance(value, str):
                continue
            field_selectors = [
                f"textarea[name='{key}']",
                f"input[name='{key}']",
                f"select[name='{key}']",
                f"textarea[id='{key}']",
                f"input[id='{key}']",
                f"select[id='{key}']",
            ]
            if type_if_available(field_selectors, value) or select_if_available(field_selectors, value):
                add_step(steps, f"fill_{key}", "ok")
            else:
                add_step(steps, f"fill_{key}", "error", f"Field {key} not found")
        snap("Filled form fields")

        step_number += 1
        emit_progress("submit")
        if click_if_available(submit_selectors):
            add_step(steps, "submit", "ok")
        else:
            try:
                r.keyboard("[enter]")
                add_step(steps, "submit", "ok", "Submitted via keyboard")
            except Exception:
                add_step(steps, "submit", "error", "Submit control not found")
        r.wait(3)

        step_number += 1
        emit_progress("verify_submission")
        snap("Final state")
        if verify_submission():
            add_step(steps, "verify", "ok", "Submission confirmation detected")
        else:
            add_step(steps, "verify", "ok", "No confirmation text detected")

        emitter.emit_result(
            {
                "success": True,
                "error": None,
                "screenshots": screenshots,
                "artifacts": create_artifacts(screenshots),
                "steps": steps,
            }
        )
        return 0
    except Exception as exc:
        add_step(steps, "automation", "error", str(exc))
        emitter.emit_error("PYTHON_RUNTIME_ERROR", str(exc), {"step": step_number, "steps": steps})
        return 1
    finally:
        try:
            r.close()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
