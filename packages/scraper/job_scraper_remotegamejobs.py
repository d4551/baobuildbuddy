#!/usr/bin/env python3
"""
RemoteGameJobs scraper using RPA-Python.
Scrapes remote gaming job listings from remotegamejobs.com and outputs JSON.
"""
import json
import hashlib
import re
import sys

DEFAULT_SOURCE_URL = "https://remotegamejobs.com"

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    sys.exit(1)


def resolve_source_url() -> str:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        source_url = payload.get("sourceUrl") if isinstance(payload, dict) else None
        if isinstance(source_url, str) and source_url.strip():
            return source_url.strip()
    except Exception:
        pass

    return DEFAULT_SOURCE_URL


def content_hash(title: str, company: str, location: str) -> str:
    raw = f"{title}|{company}|{location}".lower().strip()
    return f"rgj-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


EMP_TYPES = {"full-time", "part-time", "contract", "freelance", "internship"}
SKIP_LOWER = {"details", "subscribe", "search jobs", "looking for jobs", "get daily",
              "your email address", "job listings", "browse"}


def is_noise(line: str) -> bool:
    lower = line.lower().strip()
    if lower in SKIP_LOWER:
        return True
    if len(line) < 5 or len(line) > 200:
        return True
    if line.startswith("$") or line.startswith("(") or line.startswith("{"):
        return True
    if line.startswith("var ") or line.startswith("function") or line.startswith("//"):
        return True
    if "document." in line or "window." in line or ".ready(" in line:
        return True
    if ".hide()" in line or ".show()" in line or ".fadeIn(" in line:
        return True
    if "mouseenter" in line or "mouseleave" in line or "submit(" in line:
        return True
    if line.startswith("})") or line.startswith("});"):
        return True
    if "newsletter" in lower or "email alerts" in lower:
        return True
    if "allprogramming" in lower.replace(" ", ""):
        return True
    return False


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    try:
        r.init(turbo_mode=True, headless_mode=True)
        r.url(source_url)
        r.wait(4)
        body = r.read("body") or ""
        r.close()

        if not body or len(body) < 100:
            return jobs

        lines = [ln.strip() for ln in body.split("\n") if ln.strip()]

        in_listings = False
        i = 0
        while i < len(lines):
            line = lines[i]
            if "job listings" in line.lower() and not in_listings:
                in_listings = True
                i += 1
                continue
            if not in_listings:
                i += 1
                continue

            if is_noise(line):
                i += 1
                continue

            if line.lower() in EMP_TYPES:
                i += 1
                continue

            title = line
            company = "Unknown"

            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if (
                    next_line
                    and not is_noise(next_line)
                    and next_line.lower() not in EMP_TYPES
                    and len(next_line) < 100
                    and not next_line.startswith("Remote")
                ):
                    company = next_line
                    i += 1

            while i + 1 < len(lines) and (
                lines[i + 1].strip().lower() in EMP_TYPES
                or lines[i + 1].strip().startswith("Remote")
                or is_noise(lines[i + 1].strip())
                or len(lines[i + 1].strip()) < 20
            ):
                i += 1
                if i >= len(lines) - 1:
                    break

            jobs.append({
                "title": title[:200],
                "company": company[:100],
                "location": "Remote",
                "remote": True,
                "description": "",
                "url": source_url,
                "source": "remotegamejobs",
                "postedDate": "",
                "contentHash": content_hash(title, company, "Remote"),
            })

            i += 1

    except Exception as e:
        try:
            r.close()
        except Exception:
            pass
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs[:50]


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
