#!/usr/bin/env python3
"""
RemoteGameJobs scraper using RPA-Python.
Scrapes remote gaming job listings from remotegamejobs.com and outputs JSON.
"""
import json
import hashlib
import sys

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    sys.exit(1)


def content_hash(title: str, company: str, location: str) -> str:
    raw = f"{title}|{company}|{location}".lower().strip()
    return f"rgj-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs = []
    try:
        r.init(turbo_mode=True)
        r.url("https://remotegamejobs.com")
        r.wait(4)

        # Site uses .job-box containers with jQuery hover effects
        js_extract = """
        (function() {
            var results = [];
            var boxes = document.querySelectorAll('.job-box, [class*="job-card"], [class*="job-list"], article');
            if (boxes.length === 0) {
                // Fallback: try finding any link-heavy sections
                boxes = document.querySelectorAll('a[href*="job"], a[href*="position"], a[href*="career"]');
                boxes.forEach(function(link) {
                    var text = (link.textContent || '').trim();
                    if (text && text.length > 5) {
                        results.push({
                            title: text.substring(0, 200),
                            company: 'Unknown',
                            location: 'Remote',
                            url: link.href || ''
                        });
                    }
                });
            } else {
                boxes.forEach(function(box) {
                    var titleEl = box.querySelector('h1, h2, h3, h4, [class*="title"], a');
                    var companyEl = box.querySelector('[class*="company"], [class*="studio"], [class*="org"]');
                    var locationEl = box.querySelector('[class*="location"], [class*="loc"]');
                    var linkEl = box.querySelector('a[href]') || box.closest('a');

                    var title = titleEl ? titleEl.textContent.trim() : '';
                    if (!title) return;

                    results.push({
                        title: title.substring(0, 200),
                        company: companyEl ? companyEl.textContent.trim() : 'Unknown',
                        location: locationEl ? locationEl.textContent.trim() : 'Remote',
                        url: linkEl ? linkEl.href : ''
                    });
                });
            }
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
                    "remote": True,  # All jobs on this site are remote
                    "description": "",
                    "url": item.get("url", "https://remotegamejobs.com"),
                    "source": "remotegamejobs",
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
