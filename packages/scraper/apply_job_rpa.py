#!/usr/bin/env python3
"""
Apply a job application using RPA-Python with JSON input/output over stdin/stdout.
"""
from __future__ import annotations

import json
import sys
import tempfile

try:
    import rpa as r
except ImportError as exc:
    print(json.dumps({"success": False, "error": "RPA not installed. pip install rpa", "screenshots": [], "steps": [{"action": "import", "status": "error", "message": str(exc)}]}))
    raise SystemExit(1)


def read_payload() -> dict[str, object]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("No JSON input received")
    return json.loads(raw)


def field_candidates(value: object, keys: list[str]) -> list[str]:
    if not isinstance(value, dict):
        return []
    values: list[str] = []
    for key in keys:
        candidate = value.get(key)
        if isinstance(candidate, str) and candidate.strip():
            values.append(candidate.strip())
    return values


def collect_candidates(payload: dict[str, object], resume: dict[str, object]) -> dict[str, str]:
    personal_info = resume.get("personalInfo", {})
    if not isinstance(personal_info, dict):
        personal_info = {}

    fields = {
        "fullName": field_candidates(personal_info, ["fullName", "name", "full_name", "firstName"]),
        "email": field_candidates(personal_info, ["email", "emailAddress"]),
        "phone": field_candidates(personal_info, ["phone", "phoneNumber", "mobile"]),
    }

    return {
        "fullName": fields["fullName"][0] if fields["fullName"] else "",
        "email": fields["email"][0] if fields["email"] else "",
        "phone": fields["phone"][0] if fields["phone"] else "",
    }


def type_if_available(selectors: list[str], text: str) -> bool:
    for selector in selectors:
        try:
            r.type(selector, text)
            return True
        except Exception:
            continue
    return False


def click_if_available(selectors: list[str]) -> bool:
    for selector in selectors:
        try:
            r.click(selector)
            return True
        except Exception:
            continue
    return False


def add_step(steps: list[dict[str, object]], action: string, status: str, message: str | None = None) -> None:
    entry: dict[str, object] = {"action": action, "status": status}
    if message:
        entry["message"] = message
    steps.append(entry)


def main() -> int:
    payload = read_payload()
    job_url = payload.get("jobUrl")
    if not isinstance(job_url, str) or not job_url.strip():
        print(json.dumps({"success": False, "error": "Missing jobUrl", "screenshots": [], "steps": [{"action": "validate", "status": "error", "message": "Missing jobUrl"}]}))
        return 1

    resume = payload.get("resume")
    if not isinstance(resume, dict):
        print(json.dumps({"success": False, "error": "Missing resume payload", "screenshots": [], "steps": [{"action": "validate", "status": "error", "message": "Missing resume payload"}]}))
        return 1

    candidates = collect_candidates(payload, resume)
    custom_answers = payload.get("customAnswers", {})
    screenshots_dir = tempfile.mkdtemp(prefix="bao-build-buddy-")
    screenshots: list[str] = []
    steps: list[dict[str, object]] = []

    if not isinstance(custom_answers, dict):
        custom_answers = {}

    try:
        r.init(turbo_mode=True)
        add_step(steps, "init", "ok")

        r.url(job_url.strip())
        add_step(steps, "navigate", "ok", f"Loaded {job_url}")
        r.wait(2)
        screenshot_path = f"{screenshots_dir}/step1.png"
        r.snap("page", screenshot_path)
        screenshots.append(screenshot_path)
        add_step(steps, "screenshot", "ok", "Captured job page")

        if candidates["fullName"]:
            type_if_available(
                [
                    "input[name='fullName']",
                    "input[name='name']",
                    "input[aria-label='Full name']",
                    "input#full-name",
                ],
                candidates["fullName"],
            )
        if candidates["email"]:
            type_if_available(
                [
                    "input[type='email']",
                    "input[name='email']",
                    "input[aria-label='Email']",
                ],
                candidates["email"],
            )
        if candidates["phone"]:
            type_if_available(
                [
                    "input[type='tel']",
                    "input[name='phone']",
                    "input[aria-label='Phone']",
                ],
                candidates["phone"],
            )

        if isinstance(custom_answers, dict):
            for key, value in custom_answers.items():
                if not isinstance(key, str) or not isinstance(value, str):
                    continue
                candidate_selectors = [
                    f"textarea[name='{key}']",
                    f"input[name='{key}']",
                    f"textarea[id='{key}']",
                    f"input[id='{key}']",
                ]
                type_if_available(candidate_selectors, value)

        screenshot_path = f"{screenshots_dir}/step2.png"
        r.snap("page", screenshot_path)
        screenshots.append(screenshot_path)
        add_step(steps, "screenshot", "ok", "Captured form filled state")

        if not click_if_available(["button[type='submit']", "button[type='button'][value='Submit']", "input[type='submit']"]):
            add_step(steps, "submit", "error", "Submit control not found")
        else:
            add_step(steps, "submit", "ok")

        r.wait(2)
        screenshot_path = f"{screenshots_dir}/final.png"
        r.snap("page", screenshot_path)
        screenshots.append(screenshot_path)
        add_step(steps, "screenshot", "ok", "Captured final state")

        return_result = {
            "success": True,
            "error": None,
            "screenshots": screenshots,
            "steps": steps,
        }
        print(json.dumps(return_result))
        return 0
    except Exception as exc:
        add_step(steps, "automation", "error", str(exc))
        return_result = {
            "success": False,
            "error": str(exc),
            "screenshots": screenshots,
            "steps": steps,
        }
        print(json.dumps(return_result))
        return 1
    finally:
        try:
            r.close()
            add_step(steps, "cleanup", "ok")
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
