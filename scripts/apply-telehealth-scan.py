#!/usr/bin/env python3
"""Apply telehealth scan results to providers.json."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCAN_RESULTS = ROOT / "data" / "telehealth-scan-results.json"
PROVIDERS = ROOT / "data" / "raw" / "providers.json"

# State code mapping for nationwide providers
ALL_STATE_CODES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
]


def main():
    scan_results = json.loads(SCAN_RESULTS.read_text())
    providers = json.loads(PROVIDERS.read_text())

    # Build lookup: slug -> scan result
    scan_map = {}
    for r in scan_results:
        if r["telehealthFound"]:
            scan_map[r["slug"]] = r

    print(f"Scan results with telehealth: {len(scan_map)}")

    updated = 0
    already_had = 0

    for p in providers:
        slug = p["slug"]

        # Skip if already has telehealth
        if p.get("telehealth", {}).get("available"):
            already_had += 1
            continue

        if slug in scan_map:
            scan = scan_map[slug]
            states_served = scan["statesServed"]

            # Convert "nationwide" to all state codes
            if "nationwide" in states_served:
                states_served = ALL_STATE_CODES
            elif not states_served:
                states_served = [p["address"]["stateCode"]]

            p["telehealth"] = {
                "available": True,
                "statesServed": states_served,
                "visitTypes": scan["visitTypes"],
            }
            updated += 1

    print(f"Already had telehealth: {already_had}")
    print(f"Newly updated: {updated}")
    print(f"Total telehealth: {already_had + updated}")

    PROVIDERS.write_text(json.dumps(providers, indent=2))
    print(f"Wrote updated providers.json")


if __name__ == "__main__":
    main()
