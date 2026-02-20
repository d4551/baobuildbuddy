#!/usr/bin/env python3
"""
GrackleHQ job scraper using RPA-Python.
Scrapes gaming industry job listings from gracklehq.com/jobs and outputs JSON.
"""
import json
import hashlib
import sys

DEFAULT_SOURCE_URL = "https://gracklehq.com/jobs"

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
    return f"grackle-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs = []
    source_url = resolve_source_url()
    try:
        r.init(turbo_mode=True)
        r.url(source_url)
        r.wait(4)

        # Extract job data using DOM queries
        # GrackleHQ uses a[href*="/rd/"] links with "Company - Location" text nearby
        js_extract = """
        (function() {
            var results = [];
            var links = document.querySelectorAll('a[href*="/rd/"]');
            links.forEach(function(link) {
                var title = (link.textContent || '').trim();
                if (!title || title.length < 3) return;

                // Look for company/location in adjacent text or parent container
                var parent = link.closest('li, div, tr, article') || link.parentElement;
                var fullText = parent ? parent.textContent.replace(/\\s+/g, ' ').trim() : '';

                var company = 'Unknown';
                var location = 'Remote';

                // Parse "Company - Location" pattern from surrounding text
                var afterTitle = fullText.replace(title, '').trim();
                var parts = afterTitle.split(' - ');
                if (parts.length >= 2) {
                    company = parts[0].trim().replace(/^[\\s-]+/, '').trim();
                    location = parts[1].trim().split(/\\s{2,}/)[0].trim();
                } else if (parts.length === 1 && parts[0].trim().length > 2) {
                    company = parts[0].trim().replace(/^[\\s-]+/, '').trim();
                }

                // Clean up
                if (company.length > 100) company = company.substring(0, 100);
                if (location.length > 100) location = location.substring(0, 100);

                results.push({
                    title: title.substring(0, 200),
                    company: company || 'Unknown',
                    location: location || 'Remote',
                    url: link.href || ''
                });
            });
            return JSON.stringify(results);
        })()
        """
        raw = r.dom(js_extract)
        r.close()

        if raw and isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = []

            for item in parsed[:50]:
                title = item.get("title", "").strip()
                if not title or len(title) < 3:
                    continue
                company = item.get("company", "Unknown")
                loc = item.get("location", "Remote")
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "remote": "remote" in loc.lower(),
                    "description": "",
                    "url": item.get("url", source_url),
                    "source": "grackle",
                    "postedDate": "",
                    "contentHash": content_hash(title, company, loc),
                })
    except Exception as e:
        try:
            r.close()
        except Exception:
            pass
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
