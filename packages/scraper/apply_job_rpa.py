#!/usr/bin/env python3
"""
Apply a job application using RPA-Python with JSON input/output over stdin/stdout.

Supports smart AI-generated selectors, progress streaming via stderr,
and expanded TagUI capabilities: select, upload, dom, present, keyboard.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import shutil

try:
    import rpa as r
except ImportError as exc:
    print(json.dumps({"success": False, "error": "RPA not installed. pip install rpa", "screenshots": [], "steps": [{"action": "import", "status": "error", "message": str(exc)}]}))
    raise SystemExit(1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ALLOWED_BROWSERS = {"chrome", "chromium", "edge"}


def read_payload() -> dict[str, object]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("No JSON input received")
    return json.loads(raw)


def emit_progress(action: str, step: int, total: int, status: str = "ok", message: str | None = None) -> None:
    """Stream real-time progress to TypeScript via stderr as newline-delimited JSON."""
    progress: dict[str, object] = {
        "type": "progress",
        "action": action,
        "step": step,
        "totalSteps": total,
        "status": status,
    }
    if message:
        progress["message"] = message
    sys.stderr.write(json.dumps(progress) + "\n")
    sys.stderr.flush()


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


def present_any(selectors: list[str]) -> str | None:
    """Check if any of the given selectors are present on the page."""
    for sel in selectors:
        try:
            if r.present(sel):
                return sel
        except Exception:
            continue
    return None


def type_if_available(selectors: list[str], text: str) -> bool:
    """Try to type into the first available matching element."""
    for selector in selectors:
        try:
            if r.present(selector):
                r.type(selector, text)
                return True
        except Exception:
            continue
    return False


def click_if_available(selectors: list[str]) -> bool:
    """Try to click the first available matching element."""
    for selector in selectors:
        try:
            if r.present(selector):
                r.click(selector)
                return True
        except Exception:
            continue
    return False


def select_if_available(selectors: list[str], value: str) -> bool:
    """Try to select a dropdown option using the first available selector."""
    for sel in selectors:
        try:
            if r.present(sel):
                r.select(sel, value)
                return True
        except Exception:
            continue
    return False


def upload_if_available(selectors: list[str], file_path: str) -> bool:
    """Try to upload a file to the first available file input."""
    for sel in selectors:
        try:
            if r.present(sel):
                r.upload(sel, file_path)
                return True
        except Exception:
            continue
    return False


def get_form_fields_via_dom() -> list[dict[str, str]]:
    """Use JavaScript DOM introspection to discover all form fields on the page."""
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
        if result and isinstance(result, str):
            return json.loads(result)
    except Exception:
        pass
    return []


def add_step(steps: list[dict[str, object]], action: str, status: str, message: str | None = None) -> None:
    entry: dict[str, object] = {"action": action, "status": status}
    if message:
        entry["message"] = message
    steps.append(entry)


def init_browser(headless: bool, timeout: int, browser: str) -> None:
    """Initialize RPA browser with a resilient browser argument strategy."""
    base_kwargs = {"turbo_mode": True, "headless_mode": headless}
    preferred_kwargs = dict(base_kwargs)
    if browser:
        preferred_kwargs["browser"] = browser

    try:
        r.init(**preferred_kwargs)
    except TypeError:
        # Browser argument may not be supported by older versions.
        r.init(**base_kwargs)

    r.timeout(timeout)


def verify_submission() -> bool:
    """Read page text to check for common submission confirmation patterns."""
    try:
        page_text = r.read("page")
        if isinstance(page_text, str):
            lower = page_text.lower()
            confirmation_phrases = [
                "thank you", "application received", "application submitted",
                "successfully submitted", "we received your application",
                "application complete", "submission confirmed",
            ]
            return any(phrase in lower for phrase in confirmation_phrases)
    except Exception:
        pass
    return False


# ---------------------------------------------------------------------------
# Main flow
# ---------------------------------------------------------------------------

TOTAL_STEPS = 10


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

    # AI-generated smart selectors (merged from TypeScript side)
    selector_map: dict[str, list[str]] = payload.get("selectorMap", {})
    if not isinstance(selector_map, dict):
        selector_map = {}

    # Read automation settings
    rpa_settings = payload.get("settings", {})
    if not isinstance(rpa_settings, dict):
        rpa_settings = {}
    headless = rpa_settings.get("headless", True)
    timeout = rpa_settings.get("defaultTimeout", 30)
    auto_screenshots = rpa_settings.get("autoSaveScreenshots", True)
    default_browser = rpa_settings.get("defaultBrowser", "chrome")
    if not isinstance(default_browser, str) or not default_browser.strip():
        default_browser = "chrome"
    default_browser = default_browser.strip().lower()
    if default_browser not in ALLOWED_BROWSERS:
        default_browser = "chrome"

    step_num = 0

    def snap(label: str) -> None:
        """Capture a screenshot if auto-save is enabled."""
        if not auto_screenshots:
            return
        idx = len(screenshots) + 1
        path = f"{screenshots_dir}/step{idx}.png"
        try:
            r.snap("page", path)
            screenshots.append(path)
            add_step(steps, "screenshot", "ok", label)
        except Exception:
            pass

    try:
        # Step 1: Init browser
        step_num += 1
        emit_progress("Initializing browser", step_num, TOTAL_STEPS)
        init_browser(
            bool(headless),
            int(timeout) if isinstance(timeout, (int, float)) and int(timeout) > 0 else 30,
            str(default_browser),
        )
        add_step(steps, "init", "ok", f"headless={headless}, timeout={timeout}s")

        # Step 2: Navigate to job page
        step_num += 1
        emit_progress("Navigating to job page", step_num, TOTAL_STEPS)
        r.url(job_url.strip())
        add_step(steps, "navigate", "ok", f"Loaded {job_url}")
        r.wait(2)

        # Verify we actually loaded the page
        try:
            current_url = r.url()
            if current_url:
                add_step(steps, "url_verify", "ok", f"Current URL: {current_url}")
        except Exception:
            pass

        snap("Captured job page")

        # Step 3: Detect form fields via DOM
        step_num += 1
        emit_progress("Detecting form fields", step_num, TOTAL_STEPS)
        form_fields = get_form_fields_via_dom()
        if form_fields:
            add_step(steps, "detect_fields", "ok", f"Found {len(form_fields)} form elements")
        else:
            add_step(steps, "detect_fields", "ok", "No form fields detected via DOM, using selectors")

        # Build selector lists: AI smart selectors first, then hardcoded fallbacks
        name_selectors = selector_map.get("fullName", []) + [
            "input[name='fullName']", "input[name='name']",
            "input[aria-label='Full name']", "input#full-name",
            "input[name='first_name']", "input[name='firstName']",
        ]
        email_selectors = selector_map.get("email", []) + [
            "input[type='email']", "input[name='email']",
            "input[aria-label='Email']", "input#email",
        ]
        phone_selectors = selector_map.get("phone", []) + [
            "input[type='tel']", "input[name='phone']",
            "input[aria-label='Phone']", "input#phone",
            "input[name='phoneNumber']",
        ]
        resume_selectors = selector_map.get("resume", []) + [
            "input[type='file']", "input[name='resume']",
            "input[name='cv']", "input[accept='.pdf,.doc,.docx']",
        ]
        cover_letter_selectors = selector_map.get("coverLetter", []) + [
            "textarea[name='cover_letter']", "textarea#cover-letter",
            "textarea[name='coverLetter']", "textarea[aria-label='Cover letter']",
        ]
        submit_selectors = selector_map.get("submit", []) + [
            "button[type='submit']", "input[type='submit']",
            "button[type='button'][value='Submit']",
            "button.submit-btn", "button#submit",
        ]

        # Step 4: Fill name
        step_num += 1
        emit_progress("Filling name field", step_num, TOTAL_STEPS)
        if candidates["fullName"]:
            if type_if_available(name_selectors, candidates["fullName"]):
                add_step(steps, "fill_name", "ok", f"Filled name: {candidates['fullName']}")
            else:
                add_step(steps, "fill_name", "error", "Name field not found")
        else:
            add_step(steps, "fill_name", "ok", "No name available, skipped")

        # Step 5: Fill email
        step_num += 1
        emit_progress("Filling email field", step_num, TOTAL_STEPS)
        if candidates["email"]:
            if type_if_available(email_selectors, candidates["email"]):
                add_step(steps, "fill_email", "ok", f"Filled email: {candidates['email']}")
            else:
                add_step(steps, "fill_email", "error", "Email field not found")
        else:
            add_step(steps, "fill_email", "ok", "No email available, skipped")

        # Step 6: Fill phone
        step_num += 1
        emit_progress("Filling phone field", step_num, TOTAL_STEPS)
        if candidates["phone"]:
            if type_if_available(phone_selectors, candidates["phone"]):
                add_step(steps, "fill_phone", "ok", f"Filled phone: {candidates['phone']}")
            else:
                add_step(steps, "fill_phone", "error", "Phone field not found")
        else:
            add_step(steps, "fill_phone", "ok", "No phone available, skipped")

        # Step 7: Handle file upload (resume)
        step_num += 1
        emit_progress("Uploading resume", step_num, TOTAL_STEPS)
        file_input_present = present_any(resume_selectors)
        if file_input_present:
            # Write resume data to a temp file for upload
            try:
                resume_text = json.dumps(resume, indent=2)
                resume_path = os.path.join(screenshots_dir, "resume.txt")
                with open(resume_path, "w") as f:
                    f.write(resume_text)
                if upload_if_available(resume_selectors, resume_path):
                    add_step(steps, "upload_resume", "ok", "Resume file uploaded")
                else:
                    add_step(steps, "upload_resume", "error", "Upload failed")
            except Exception as exc:
                add_step(steps, "upload_resume", "error", f"Upload error: {exc}")
        else:
            add_step(steps, "upload_resume", "ok", "No file input found, skipped")

        # Fill cover letter text if available
        cover_letter = payload.get("coverLetter")
        if isinstance(cover_letter, dict):
            content = cover_letter.get("content", {})
            if isinstance(content, dict):
                cl_text = "\n\n".join(filter(None, [
                    content.get("introduction", ""),
                    content.get("body", ""),
                    content.get("conclusion", ""),
                ]))
                if cl_text.strip():
                    if type_if_available(cover_letter_selectors, cl_text):
                        add_step(steps, "fill_cover_letter", "ok", "Cover letter filled")
                    else:
                        add_step(steps, "fill_cover_letter", "ok", "Cover letter field not found, skipped")

        # Step 8: Fill custom answers and handle dropdowns
        step_num += 1
        emit_progress("Filling custom fields", step_num, TOTAL_STEPS)
        if isinstance(custom_answers, dict):
            for key, value in custom_answers.items():
                if not isinstance(key, str) or not isinstance(value, str):
                    continue
                # Try textarea first, then input, then select (dropdown)
                text_selectors = [
                    f"textarea[name='{key}']",
                    f"input[name='{key}']",
                    f"textarea[id='{key}']",
                    f"input[id='{key}']",
                ]
                if type_if_available(text_selectors, value):
                    add_step(steps, f"fill_{key}", "ok", f"Filled {key}")
                else:
                    # Try as dropdown select
                    dropdown_selectors = [
                        f"select[name='{key}']",
                        f"select[id='{key}']",
                    ]
                    if select_if_available(dropdown_selectors, value):
                        add_step(steps, f"select_{key}", "ok", f"Selected {key}={value}")
                    else:
                        add_step(steps, f"fill_{key}", "error", f"Field {key} not found")

        snap("Captured form filled state")

        # Step 9: Submit
        step_num += 1
        emit_progress("Submitting application", step_num, TOTAL_STEPS)
        if click_if_available(submit_selectors):
            add_step(steps, "submit", "ok")
        else:
            # Try keyboard submit as fallback
            try:
                r.keyboard("[enter]")
                add_step(steps, "submit", "ok", "Submitted via keyboard Enter")
            except Exception:
                add_step(steps, "submit", "error", "Submit control not found")

        r.wait(3)

        # Step 10: Verify submission
        step_num += 1
        emit_progress("Verifying submission", step_num, TOTAL_STEPS)
        snap("Captured final state")

        if verify_submission():
            add_step(steps, "verify", "ok", "Submission confirmation detected on page")
        else:
            add_step(steps, "verify", "ok", "No confirmation text detected (may still have succeeded)")

        emit_progress("Complete", step_num, TOTAL_STEPS, "ok", "Automation finished")

        return_result = {
            "success": True,
            "error": None,
            "screenshots": screenshots,
            "steps": steps,
        }
        print(json.dumps(return_result))
        return 0
    except Exception as exc:
        emit_progress("Error", step_num, TOTAL_STEPS, "error", str(exc))
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
        try:
            shutil.rmtree(screenshots_dir, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
