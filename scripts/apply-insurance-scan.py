#!/usr/bin/env python3
"""Apply insurance scan results to Supabase providers table.

Also applies heuristics for providers without websites:
- Pharmacies without websites → "varies" (compounding may not, dispensing may)

Usage:
  python3 scripts/apply-insurance-scan.py --preview    # Show what would change
  python3 scripts/apply-insurance-scan.py --apply       # Apply changes to Supabase
"""

import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SCAN_RESULTS = ROOT / "data" / "insurance-scan-results.json"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def update_provider(slug: str, updates: dict) -> bool:
    """Update a provider record by slug."""
    url = f"{SUPABASE_URL}/rest/v1/providers?slug=eq.{slug}"
    resp = requests.patch(url, headers=HEADERS, json=updates)
    return resp.status_code in (200, 204)


def fetch_providers_without_websites() -> list:
    """Fetch providers that have no website and insurance=unknown."""
    all_rows = []
    offset = 0
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/providers"
            f"?select=slug,name,type,website,insurance"
            f"&insurance=eq.unknown"
            f"&order=slug.asc"
            f"&limit=1000&offset={offset}"
        )
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            break
        rows = resp.json()
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < 1000:
            break
        offset += 1000
    return all_rows


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--preview"

    # --- Part 1: Apply scan results ---
    scan_updates = {}
    if SCAN_RESULTS.exists():
        results = json.loads(SCAN_RESULTS.read_text())
        for r in results:
            if r["classification"] != "unknown":
                updates = {"insurance": r["classification"]}
                # Add HSA/FSA to pricing if detected
                if r["hsaFsa"]:
                    updates["pricing"] = json.dumps({
                        "acceptsHSA": True,
                        "acceptsFSA": True,
                    })
                scan_updates[r["slug"]] = {
                    "updates": updates,
                    "classification": r["classification"],
                    "confidence": r["confidence"],
                    "hsaFsa": r["hsaFsa"],
                }
        print(f"Scan results: {len(scan_updates)} providers to update")
    else:
        print(f"No scan results at {SCAN_RESULTS} — skipping website-based updates")

    # --- Part 2: Heuristics for providers without websites ---
    print("\nFetching providers without insurance data...")
    no_insurance = fetch_providers_without_websites()
    print(f"Found {len(no_insurance)} providers with insurance=unknown")

    heuristic_updates = {}
    for p in no_insurance:
        slug = p["slug"]
        if slug in scan_updates:
            continue  # Already handled by scan

        # Pharmacy heuristic: compounding pharmacies rarely accept insurance
        if p["type"] == "pharmacy":
            heuristic_updates[slug] = {
                "updates": {"insurance": "varies"},
                "classification": "varies",
                "reason": "pharmacy heuristic",
            }

    print(f"Heuristic updates: {len(heuristic_updates)} (pharmacies → varies)")

    # --- Summary ---
    by_class = {}
    for v in list(scan_updates.values()) + list(heuristic_updates.values()):
        c = v["classification"]
        by_class[c] = by_class.get(c, 0) + 1

    hsa_count = sum(1 for v in scan_updates.values() if v.get("hsaFsa"))

    print(f"\n=== TOTAL UPDATES ===")
    print(f"  Accepted:     {by_class.get('accepted', 0)}")
    print(f"  Not accepted: {by_class.get('not-accepted', 0)}")
    print(f"  Varies:       {by_class.get('varies', 0)}")
    print(f"  HSA/FSA:      {hsa_count}")
    print(f"  Total:        {len(scan_updates) + len(heuristic_updates)}")

    if mode == "--preview":
        # Show samples
        print("\n--- Sample accepted ---")
        for slug, v in list(scan_updates.items())[:5]:
            if v["classification"] == "accepted":
                print(f"  {slug}")
        print("\n--- Sample not-accepted ---")
        for slug, v in list(scan_updates.items())[:100]:
            if v["classification"] == "not-accepted":
                print(f"  {slug}")
                break
        print("\nRun with --apply to update Supabase.")
        return

    if mode == "--apply":
        total = len(scan_updates) + len(heuristic_updates)
        done = 0
        failed = 0

        # Apply scan-based updates
        for slug, v in scan_updates.items():
            ok = update_provider(slug, v["updates"])
            if ok:
                done += 1
            else:
                failed += 1
                if failed <= 3:
                    print(f"  ✗ Failed: {slug}")
            if (done + failed) % 200 == 0:
                print(f"  Progress: {done + failed}/{total}")

        # Apply heuristic updates
        for slug, v in heuristic_updates.items():
            ok = update_provider(slug, v["updates"])
            if ok:
                done += 1
            else:
                failed += 1
            if (done + failed) % 200 == 0:
                print(f"  Progress: {done + failed}/{total}")

        print(f"\n=== DONE ===")
        print(f"  Updated: {done}")
        print(f"  Failed:  {failed}")
        print(f"\nNext: run export + rebuild to include insurance data on the site.")


if __name__ == "__main__":
    main()
