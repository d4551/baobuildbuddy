# Automation & RPA

## Bun-Native Approach

NAVI Omega uses **Playwright** (Node/Bun compatible) for browser automation rather than RPA-Python. This keeps the stack Bun-native with no Python bridge.

### Rationale

- **RPA-Python** (TagUI) is Python-based; integrating would require subprocess calls or a separate Python service.
- **Playwright** runs in Bun/Node, shares the same process, and provides equivalent web automation (navigate, click, fill, screenshot).
- Industry practice: prefer native tooling to avoid process boundaries and serialization overhead.

### Playwright Automation Service

For job application automation (filling ATS forms, submitting applications), use the `ApplicationAutomationService` (to be implemented in `packages/server/src/services/automation/`). It will:

1. Accept job URL + resume data + application answers.
2. Launch headless browser via Playwright.
3. Navigate, fill forms, upload resume.
4. Return status and screenshots for verification.

### RPA-Python Integration (Optional)

If you need RPA-Python (TagUI) for visual automation, OCR, or desktop automation:

1. Install: `pip install rpa`
2. Create a Python script that accepts JSON args and outputs JSON result.
3. Call from Bun: `Bun.spawn(["python", "scripts/apply_rpa.py"], { stdin: "pipe", stdout: "pipe" })`.
4. Document the script interface in this folder.

For now, Playwright covers web-based job application automation without external dependencies.
