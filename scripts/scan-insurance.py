#!/usr/bin/env python3
"""Scan provider websites for insurance acceptance indicators."""

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
PROVIDERS = ROOT / "data" / "raw" / "providers.json"
OUTPUT = ROOT / "data" / "insurance-scan-results.json"

# --- Keyword groups ---

ACCEPTED_KEYWORDS = [
    "we accept insurance",
    "insurance accepted",
    "accepts most insurance",
    "accept most major insurance",
    "accepts insurance",
    "insurance plans accepted",
    "we bill insurance",
    "insurance billing",
    "covered by insurance",
    "in-network",
    "in network provider",
    "we are in-network",
    "insurance plans we accept",
    "accepted insurance plans",
    "we work with most insurance",
    "most insurance plans",
    "file with your insurance",
    "bill your insurance",
    "insurance-friendly",
]

NOT_ACCEPTED_KEYWORDS = [
    "cash only",
    "cash pay only",
    "cash-pay",
    "does not accept insurance",
    "don't accept insurance",
    "do not accept insurance",
    "no insurance accepted",
    "self-pay only",
    "self pay only",
    "out of pocket",
    "out-of-pocket only",
    "we do not bill insurance",
    "insurance is not accepted",
    "private pay only",
    "we are not in-network",
    "not in network",
    "does not bill insurance",
    "we don't bill insurance",
    "cash-based practice",
    "cash based practice",
    "direct pay",
    "membership-based",
    "concierge model",
]

VARIES_KEYWORDS = [
    "some insurance",
    "select insurance",
    "varies by",
    "check with your insurance",
    "insurance may cover",
    "coverage varies",
    "depends on your plan",
    "we accept some insurance",
    "limited insurance",
    "contact us about insurance",
    "insurance on a case-by-case",
    "we can provide a superbill",
    "superbill for reimbursement",
    "out-of-network reimbursement",
    "out of network reimbursement",
    "submit to your insurance for reimbursement",
]

HSA_FSA_KEYWORDS = [
    "hsa", "fsa", "health savings account", "flexible spending account",
    "hsa accepted", "fsa accepted", "hsa/fsa",
]

SUBPAGES = [
    "/insurance", "/payment", "/pricing", "/faq", "/about", "/services",
    "/fees", "/financial-policy", "/billing", "/pay", "/patient-info",
    "/new-patients", "/financial", "/cost", "/rates", "/plans",
]

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


def scan_provider(provider: dict) -> dict:
    """Scan a single provider's website for insurance indicators."""
    website = provider["website"].rstrip("/")
    result = {
        "slug": provider["slug"],
        "name": provider["name"],
        "type": provider["type"],
        "website": website,
        "classification": "unknown",
        "acceptedHits": [],
        "notAcceptedHits": [],
        "variesHits": [],
        "hsaFsa": False,
        "confidence": "none",
        "pagesChecked": [],
        "error": None,
    }

    # Fetch homepage + subpages
    pages_to_check = [website] + [website + sp for sp in SUBPAGES]
    all_text = ""

    for url in pages_to_check:
        text = fetch_page(url)
        if text:
            result["pagesChecked"].append(url)
            all_text += " " + text

    if not all_text.strip():
        result["error"] = "Could not fetch website"
        return result

    # --- Phase 1: Exact keyword matching ---
    for kw in ACCEPTED_KEYWORDS:
        if kw in all_text:
            result["acceptedHits"].append(kw)

    for kw in NOT_ACCEPTED_KEYWORDS:
        if kw in all_text:
            result["notAcceptedHits"].append(kw)

    for kw in VARIES_KEYWORDS:
        if kw in all_text:
            result["variesHits"].append(kw)

    # HSA/FSA detection
    for kw in HSA_FSA_KEYWORDS:
        if kw in all_text:
            result["hsaFsa"] = True
            break

    # --- Phase 2: Contextual regex matching ---
    # Look for "insurance" near positive/negative context words
    ACCEPT_CONTEXT = re.compile(
        r"(?:accept|take|work with|bill|file|submit|in.network|participate)"
        r".{0,20}insurance"
        r"|insurance.{0,20}(?:accept|welcome|covered|plan|carrier|provider)",
        re.IGNORECASE,
    )
    NOT_ACCEPT_CONTEXT = re.compile(
        r"(?:not|don.?t|do not|does not|no|without).{0,20}"
        r"(?:accept|take|bill|file).{0,15}insurance"
        r"|insurance.{0,20}(?:not accepted|not covered|excluded)"
        r"|(?:cash|self).?pay"
        r"|(?:private|direct).?pay.?(?:only|practice|clinic|model)",
        re.IGNORECASE,
    )
    VARIES_CONTEXT = re.compile(
        r"(?:some|limited|select|certain).{0,15}insurance"
        r"|insurance.{0,15}(?:may|might|varies|depend|case)"
        r"|superbill"
        r"|out.of.network.{0,20}(?:reimburs|benefit)",
        re.IGNORECASE,
    )

    accept_ctx = ACCEPT_CONTEXT.findall(all_text)
    not_accept_ctx = NOT_ACCEPT_CONTEXT.findall(all_text)
    varies_ctx = VARIES_CONTEXT.findall(all_text)

    if accept_ctx:
        result["acceptedHits"].extend([f"regex: {m[:50]}" for m in accept_ctx[:3]])
    if not_accept_ctx:
        result["notAcceptedHits"].extend([f"regex: {m[:50]}" for m in not_accept_ctx[:3]])
    if varies_ctx:
        result["variesHits"].extend([f"regex: {m[:50]}" for m in varies_ctx[:3]])

    # --- Classify ---
    accepted_count = len(result["acceptedHits"])
    not_accepted_count = len(result["notAcceptedHits"])
    varies_count = len(result["variesHits"])

    if not_accepted_count > 0 and accepted_count == 0:
        result["classification"] = "not-accepted"
        result["confidence"] = "high" if not_accepted_count >= 2 else "medium"
    elif accepted_count > 0 and not_accepted_count == 0:
        result["classification"] = "accepted"
        result["confidence"] = "high" if accepted_count >= 2 else "medium"
    elif accepted_count > 0 and not_accepted_count > 0:
        # Mixed signals → varies
        result["classification"] = "varies"
        result["confidence"] = "medium"
    elif varies_count > 0:
        result["classification"] = "varies"
        result["confidence"] = "medium" if varies_count >= 2 else "low"
    # else: stays "unknown"

    return result


def main():
    limit = None
    for i, arg in enumerate(sys.argv[1:]):
        if arg == "--limit" and i + 1 < len(sys.argv) - 1:
            limit = int(sys.argv[i + 2])

    # Load providers with websites
    providers = json.loads(PROVIDERS.read_text())
    targets = [p for p in providers if p.get("website") and len(p["website"]) > 5]
    print(f"Found {len(targets)} providers with websites (out of {len(providers)} total)")

    if limit:
        targets = targets[:limit]
        print(f"Limited to {limit} providers")

    results = []
    classified = 0

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(scan_provider, t): t for t in targets}
        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            results.append(result)
            if result["classification"] != "unknown":
                classified += 1
            status = result["classification"]
            conf = result["confidence"]
            if i % 50 == 0 or i == len(targets):
                print(f"  [{i}/{len(targets)}] {classified} classified so far")

    # Sort by classification
    order = {"accepted": 0, "not-accepted": 1, "varies": 2, "unknown": 3}
    results.sort(key=lambda r: (order.get(r["classification"], 4), r["slug"]))

    OUTPUT.write_text(json.dumps(results, indent=2))

    # Summary
    by_class = {}
    for r in results:
        c = r["classification"]
        by_class[c] = by_class.get(c, 0) + 1

    hsa_count = sum(1 for r in results if r["hsaFsa"])
    errors = sum(1 for r in results if r["error"])

    print(f"\n=== RESULTS ===")
    print(f"  Accepted:     {by_class.get('accepted', 0)}")
    print(f"  Not accepted: {by_class.get('not-accepted', 0)}")
    print(f"  Varies:       {by_class.get('varies', 0)}")
    print(f"  Unknown:      {by_class.get('unknown', 0)}")
    print(f"  HSA/FSA:      {hsa_count}")
    print(f"  Fetch errors: {errors}")
    print(f"\nResults saved to {OUTPUT}")


if __name__ == "__main__":
    main()
