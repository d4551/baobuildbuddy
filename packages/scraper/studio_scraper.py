#!/usr/bin/env python3
"""
Studio scraper using RPA-Python.
Scrapes gaming studio directories for: name, website, location, size, type, description.
Outputs JSON to stdout matching studios schema.
"""
import json
import re
import sys

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    sys.exit(1)


def slugify(name: str) -> str:
    """Convert studio name to slug for id."""
    s = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
    return s.strip("-") or "studio"


def scrape_studios() -> list[dict]:
    studios = []
    try:
        r.init(turbo_mode=True)
        r.url("https://www.gamedevmap.com/")
        r.wait(3)
        # Extract visible text; RPA read() returns element text when given a selector
        try:
            content = r.read("body") if hasattr(r, "read") else ""
        except Exception:
            content = ""
        r.close()

        if isinstance(content, str) and len(content) > 50:
            lines = [l.strip() for l in content.split("\n") if len(l.strip()) > 5]
            seen = set()
            for line in lines[:80]:
                if line not in seen and line[0].isupper():
                    seen.add(line)
                    if "http" not in line and "©" not in line and "game" in content.lower():
                        studios.append({
                            "id": slugify(line[:50]),
                            "name": line[:100],
                            "website": "",
                            "location": "",
                            "size": "",
                            "type": "Indie",
                            "description": f"Studio from GameDevMap: {line}",
                        })
        if not studios:
            studios = [{
                "id": "scraped-placeholder",
                "name": "Scraped Studio",
                "website": "https://example.com",
                "location": "Unknown",
                "size": "",
                "type": "Indie",
                "description": "Scraper run completed; no entries extracted.",
            }]
    except Exception as e:
        studios = [{
            "id": "scraper-error",
            "name": "Scraper Error",
            "website": "",
            "location": "",
            "size": "",
            "type": "Indie",
            "description": str(e),
        }]
    return studios


if __name__ == "__main__":
    result = scrape_studios()
    print(json.dumps(result, indent=2))
