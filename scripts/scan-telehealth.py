#!/usr/bin/env python3
"""Scan provider websites for telehealth indicators."""

import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parent.parent
TARGETS = ROOT / "data" / "telehealth-scan-targets.json"
OUTPUT = ROOT / "data" / "telehealth-scan-results.json"

TELEHEALTH_KEYWORDS = [
    "telehealth", "telemedicine", "virtual visit", "video visit",
    "online consultation", "remote consultation", "virtual care",
    "virtual appointment", "online visit", "video consultation",
    "nationwide", "all 50 states", "all states",
]

VISIT_TYPE_PATTERNS = {
    "video": r"video\s*(visit|call|consultation|appointment|chat)",
    "phone": r"phone\s*(visit|call|consultation|appointment)|tele(?:phone|health)\s*(?:visit|call)",
    "async": r"async|asynchronous|messaging|text\s*consult",
}

SUBPAGES = ["/telehealth", "/virtual-visits", "/services", "/telemedicine", "/online-visits"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}


def fetch_page(url: str, timeout: int = 10) -> str:
    """Fetch page text, return empty string on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp.text.lower()
    except Exception:
        pass
    return ""


def scan_provider(target: dict) -> dict:
    """Scan a single provider's website for telehealth indicators."""
    website = target["website"].rstrip("/")
    result = {
        "slug": target["slug"],
        "name": target["name"],
        "website": website,
        "city": target["city"],
        "stateCode": target["stateCode"],
        "telehealthFound": False,
        "evidence": [],
        "visitTypes": [],
        "statesServed": [],
        "confidence": "none",
        "pagesChecked": [],
    }

    # Check homepage
    pages_to_check = [website] + [website + sp for sp in SUBPAGES]
    all_text = ""

    for url in pages_to_check:
        text = fetch_page(url)
        if text:
            result["pagesChecked"].append(url)
            all_text += " " + text

    if not all_text.strip():
        result["evidence"].append("Could not fetch website")
        return result

    # Search for telehealth keywords
    found_keywords = []
    for kw in TELEHEALTH_KEYWORDS:
        if kw in all_text:
            found_keywords.append(kw)

    if found_keywords:
        result["telehealthFound"] = True
        result["evidence"] = [f"Found keywords: {', '.join(found_keywords)}"]

        # Determine confidence
        if len(found_keywords) >= 3:
            result["confidence"] = "high"
        elif len(found_keywords) >= 1:
            result["confidence"] = "medium"

        # Detect visit types
        for vtype, pattern in VISIT_TYPE_PATTERNS.items():
            if re.search(pattern, all_text):
                result["visitTypes"].append(vtype)

        # Default to video if telehealth found but no specific type
        if not result["visitTypes"]:
            result["visitTypes"] = ["video"]

        # Check for multi-state mentions
        if "nationwide" in all_text or "all 50 states" in all_text or "all states" in all_text:
            result["statesServed"] = ["nationwide"]
            result["confidence"] = "high"

    return result


def main():
    targets = json.loads(TARGETS.read_text())
    print(f"Scanning {len(targets)} provider websites...")

    results = []
    found_count = 0

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(scan_provider, t): t for t in targets}
        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            results.append(result)
            status = "FOUND" if result["telehealthFound"] else "no"
            if result["telehealthFound"]:
                found_count += 1
            conf = result["confidence"]
            print(f"  [{i}/{len(targets)}] {result['name'][:40]:<40} {status} ({conf})")

    # Sort: found first, then by confidence
    conf_order = {"high": 0, "medium": 1, "none": 2}
    results.sort(key=lambda r: (not r["telehealthFound"], conf_order.get(r["confidence"], 3)))

    OUTPUT.write_text(json.dumps(results, indent=2))
    print(f"\nDone! {found_count}/{len(targets)} providers have telehealth indicators")
    print(f"Results saved to {OUTPUT}")

    # Summary
    high = sum(1 for r in results if r["confidence"] == "high")
    medium = sum(1 for r in results if r["confidence"] == "medium")
    print(f"  High confidence: {high}")
    print(f"  Medium confidence: {medium}")


if __name__ == "__main__":
    main()
