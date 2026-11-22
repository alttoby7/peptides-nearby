#!/usr/bin/env python3
"""Fresh website scan of every listed provider. Python 3.12 + httpx.

One polite pass over each provider's own website (homepage + up to 3 same-site pages
picked by link text: contact / about / team / services / peptides / weight loss /
telehealth). Produces two outputs:

  PUBLIC  data/site-scan.json  (committed; feeds prepare-data.ts)
     per slug: checkedAt, alive, httpStatus, finalHost, peptides[] (deterministic alias
     match, same rules as tag-peptides.ts), telehealth (+ evidence URL), hours (only from
     the site's own schema.org JSON-LD), pagesChecked.

  PRIVATE --private-out <file.jsonl>  (never committed; the repo is public)
     everything above plus published email addresses with the page they were found on,
     and credential signals (MD / DO / NP / PA-C / PharmD ...) for outreach qualification.

Politeness: GET only, no forms, one request per host at a time with a >=1.1 s gap,
max 4 pages per site, 15 s timeout, honest UA. Responses cached under --cache-dir so
reruns are free.

Usage:
  python scripts/site-scan.py --private-out "<dir>/site-scan-private.jsonl" [--workers 24]
         [--limit N] [--only slug ...] [--offline]
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import gzip
import hashlib
import html
import json
import re
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx

ROOT = Path(__file__).resolve().parent.parent
PROVIDERS = ROOT / "src/lib/data/providers.json"
PUBLIC_OUT = ROOT / "data/site-scan.json"
UA = "Mozilla/5.0 (compatible; PeptidesNearbyBot/1.0; +https://www.peptidesnearby.com/about)"

# Same alias rules as scripts/tag-peptides.ts (kept in sync by hand; deterministic).
PEPTIDE_RULES: dict[str, tuple[str, list[str]]] = {
    "bpc-157": ("any", ["bpc-157", "bpc 157", "bpc157", "pl 14736", "body protection compound"]),
    "tb-500": ("any", ["tb-500", "tb 500", "tb500", "thymosin beta-4", "thymosin beta 4", "thymosin beta4"]),
    "ghk-cu": ("any", ["ghk-cu", "ghk cu", "ghk copper", "copper tripeptide", "copper peptide"]),
    "semaglutide": ("any", ["semaglutide", "ozempic", "wegovy", "rybelsus"]),
    "tirzepatide": ("any", ["tirzepatide", "mounjaro", "zepbound"]),
    "sermorelin": ("any", ["sermorelin"]),
    "pt-141": ("any", ["pt-141", "pt 141", "pt141", "bremelanotide", "vyleesi"]),
    "cjc-1295-ipamorelin": ("all", ["cjc-1295", "ipamorelin"]),
    "nad-plus": ("any", ["nad+", "nad plus", "nad iv", "nicotinamide adenine dinucleotide"]),
    "epithalon": ("any", ["epithalon", "epitalon"]),
    "selank": ("any", ["selank"]),
    "semax": ("any", ["semax"]),
    "kisspeptin": ("any", ["kisspeptin"]),
    "tesamorelin": ("any", ["tesamorelin", "egrifta"]),
    "ghrp-6": ("any", ["ghrp-6", "ghrp 6"]),
    "ghrp-2": ("any", ["ghrp-2", "ghrp 2"]),
    "hexarelin": ("any", ["hexarelin"]),
    "mots-c": ("any", ["mots-c", "mots c"]),
    "glutathione": ("any", ["glutathione"]),
    "hcg": ("any", ["hcg", "human chorionic gonadotropin"]),
    "liraglutide": ("any", ["liraglutide", "saxenda", "victoza"]),
    "5-amino-1mq": ("any", ["5-amino-1mq", "5 amino 1mq", "5amino1mq", "5-amino 1mq"]),
    "retatrutide": ("any", ["retatrutide"]),
    "oxytocin": ("any", ["oxytocin"]),
    "aod-9604": ("any", ["aod-9604", "aod 9604", "aod9604"]),
    "thymosin-alpha-1": ("any", ["thymosin alpha-1", "thymosin alpha 1", "thymosin alpha1", "zadaxin"]),
    "dsip": ("any", ["delta sleep-inducing peptide", "delta sleep inducing peptide"]),
    "ss-31": ("any", ["ss-31", "elamipretide"]),
    "melanotan-2": ("any", ["melanotan-2", "melanotan 2", "melanotan ii", "melanotan"]),
}
GLP1 = {"semaglutide", "tirzepatide", "liraglutide", "retatrutide"}
MATCHERS = [
    (slug, mode, [re.compile(r"(?<![a-z0-9])" + re.escape(a) + r"(?![a-z0-9])", re.I) for a in aliases])
    for slug, (mode, aliases) in PEPTIDE_RULES.items()
]
TELEHEALTH_RE = re.compile(
    r"\b(telehealth|telemedicine|virtual (?:visit|consult(?:ation)?|appointment|care)|video (?:visit|consult(?:ation)?)|online consult(?:ation)?)s?\b",
    re.I,
)
CRED_RE = re.compile(
    r"(?<![A-Za-z])(M\.?D\.?|D\.?O\.?|N\.?P\.?-?C?|A?PRN|FNP-?(?:BC|C)?|DNP|PA-C|Pharm\.?\s?D\.?|R\.?Ph\.?|N\.?M\.?D\.?|N\.?D\.?)(?![A-Za-z])"
)
CRED_CONTEXT_RE = re.compile(r"\b(board[- ]certified|medical director|licensed (?:physician|pharmacist|nurse practitioner)|nurse practitioner|physician assistant)\b", re.I)
EMAIL_RE = re.compile(r"(?<![A-Za-z0-9._%+-])([A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24})(?![A-Za-z0-9])")
OBF_RE = re.compile(r"([A-Za-z0-9._%+-]{1,64})\s*[\[\(\{]\s*at\s*[\]\)\}]\s*([A-Za-z0-9-]{1,63})\s*[\[\(\{]\s*dot\s*[\]\)\}]\s*([A-Za-z]{2,24})", re.I)
CFEMAIL_RE = re.compile(r'data-cfemail="([0-9a-fA-F]+)"|/cdn-cgi/l/email-protection#([0-9a-fA-F]+)')
BAD_EMAIL_PARTS = (
    "example.com", "domain.com", "email.com", "yourdomain", "yoursite", "sentry", "wixpress.com",
    "@2x", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", "godaddy.com", "squarespace.com",
    "wordpress.com", "schema.org", "w3.org", "jquery", "bootstrap", "test@", "name@", "user@",
    "johndoe", "john.doe", "jane.doe", "noreply", "no-reply", "donotreply", "mailer-daemon",
)
LINK_HINT_RE = re.compile(r"contact|about|team|staff|our-?providers|meet|services|peptide|weight|semaglutide|tirzepatide|glp|telehealth|virtual|hours|locations?", re.I)
SKIP_LINK_RE = re.compile(r"\.(pdf|jpe?g|png|gif|webp|svg|mp4|zip|docx?)$|^mailto:|^tel:|^javascript:|#", re.I)

_host_locks: dict[str, threading.Lock] = {}
_host_last: dict[str, float] = {}
_glock = threading.Lock()


def host_of(url: str) -> str:
    h = (urlparse(url).hostname or "").lower()
    return h[4:] if h.startswith("www.") else h


def polite_wait(host: str) -> threading.Lock:
    with _glock:
        lock = _host_locks.setdefault(host, threading.Lock())
    return lock


def cache_path(cache_dir: Path, url: str) -> Path:
    return cache_dir / (hashlib.sha1(url.encode()).hexdigest()[:20] + ".json.gz")


def fetch(client: httpx.Client, url: str, cache_dir: Path, offline: bool) -> dict:
    cp = cache_path(cache_dir, url)
    if cp.exists():
        try:
            return json.loads(gzip.decompress(cp.read_bytes()))
        except Exception:
            pass
    if offline:
        return {"url": url, "status": 0, "error": "offline-miss", "final": url, "body": ""}
    host = host_of(url)
    lock = polite_wait(host)
    with lock:
        gap = time.time() - _host_last.get(host, 0)
        if gap < 1.1:
            time.sleep(1.1 - gap)
        try:
            r = client.get(url)
            ctype = r.headers.get("content-type", "")
            body = r.text if ("html" in ctype or "text" in ctype or not ctype) else ""
            rec = {"url": url, "status": r.status_code, "final": str(r.url), "body": body[:1_500_000], "error": None}
        except Exception as e:  # network errors are data, not crashes
            rec = {"url": url, "status": 0, "final": url, "body": "", "error": type(e).__name__}
        finally:
            _host_last[host] = time.time()
    try:
        cp.write_bytes(gzip.compress(json.dumps(rec).encode()))
    except Exception:
        pass
    return rec


def visible_text(body: str) -> str:
    s = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", body)
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s))


def decode_cf(hexstr: str) -> str:
    try:
        b = bytes.fromhex(hexstr)
        k = b[0]
        return "".join(chr(x ^ k) for x in b[1:])
    except Exception:
        return ""


def extract_emails(body: str) -> set[str]:
    found: set[str] = set()
    for m in re.finditer(r'mailto:([^"\'?>\s]+)', body, re.I):
        found.add(html.unescape(m.group(1)))
    text = html.unescape(re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", body))
    for m in EMAIL_RE.finditer(text):
        found.add(m.group(1))
    for m in OBF_RE.finditer(visible_text(body)):
        found.add(f"{m.group(1)}@{m.group(2)}.{m.group(3)}")
    for m in CFEMAIL_RE.finditer(body):
        d = decode_cf(m.group(1) or m.group(2))
        if "@" in d:
            found.add(d)
    out = set()
    for e in found:
        e = e.strip().strip(".").lower()
        e = re.sub(r"^%20|%20$", "", e)
        if not EMAIL_RE.fullmatch(e):
            continue
        if any(p in e for p in BAD_EMAIL_PARTS):
            continue
        out.add(e)
    return out


def extract_hours(body: str) -> list[str] | None:
    hours: list[str] = []
    for m in re.finditer(r'(?is)<script[^>]+application/ld\+json[^>]*>(.*?)</script>', body):
        try:
            data = json.loads(m.group(1).strip())
        except Exception:
            continue
        stack = [data]
        while stack:
            n = stack.pop()
            if isinstance(n, list):
                stack.extend(n)
            elif isinstance(n, dict):
                oh = n.get("openingHours")
                if isinstance(oh, str):
                    hours.append(oh)
                elif isinstance(oh, list):
                    hours.extend(str(x) for x in oh if isinstance(x, str))
                spec = n.get("openingHoursSpecification")
                specs = spec if isinstance(spec, list) else [spec] if isinstance(spec, dict) else []
                for sp in specs:
                    if not isinstance(sp, dict):
                        continue
                    days = sp.get("dayOfWeek")
                    days = days if isinstance(days, list) else [days]
                    names = []
                    for d in days:
                        if isinstance(d, dict):
                            d = d.get("name") or d.get("@id") or ""
                        d = str(d).rsplit("/", 1)[-1].strip()
                        if d[:2].lower() in ("mo", "tu", "we", "th", "fr", "sa", "su"):
                            names.append(d[:2].capitalize())
                    days = names
                    o, c = sp.get("opens"), sp.get("closes")
                    if days and o and c and not (str(o)[:5] == "00:00" and str(c)[:5] == "00:00"):
                        hours.append(f"{','.join(days)} {str(o)[:5]}-{str(c)[:5]}")
                stack.extend(v for k, v in n.items() if isinstance(v, (dict, list)) and k != "openingHoursSpecification")
    hours = list(dict.fromkeys(h.strip() for h in hours if h and len(h) < 80 and h[:1].isalpha() and "{" not in h))
    return hours[:14] or None


def pick_links(body: str, base: str, site_host: str) -> list[str]:
    links = []
    for m in re.finditer(r'(?is)<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', body):
        href, label = m.group(1).strip(), visible_text(m.group(2))[:80]
        if SKIP_LINK_RE.search(href):
            continue
        u = urljoin(base, href).split("#")[0]
        if host_of(u) != site_host or not u.startswith("http"):
            continue
        if LINK_HINT_RE.search(href) or LINK_HINT_RE.search(label):
            score = 0 if re.search(r"contact", href + label, re.I) else 1 if re.search(r"about|team|staff|meet|providers", href + label, re.I) else 2
            links.append((score, u))
    seen, out = set(), []
    for _, u in sorted(links):
        if u not in seen and u.rstrip("/") != base.rstrip("/"):
            seen.add(u)
            out.append(u)
    return out[:3]


def scan(provider: dict, client: httpx.Client, cache_dir: Path, offline: bool) -> dict:
    site = provider["website"].strip()
    if not site.startswith("http"):
        site = "http://" + site
    checked = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    home = fetch(client, site, cache_dir, offline)
    rec = {
        "slug": provider["slug"], "checkedAt": checked, "httpStatus": home["status"],
        "alive": 200 <= home["status"] < 400 and bool(home["body"]), "error": home["error"],
        "finalHost": host_of(home["final"]), "pagesChecked": [], "peptides": [], "telehealth": False,
        "telehealthUrl": None, "hours": None, "emails": [], "credentials": [],
    }
    if not rec["alive"]:
        return rec
    pages = [home] + [fetch(client, u, cache_dir, offline) for u in pick_links(home["body"], home["final"], host_of(home["final"]))]
    found_pep: dict[str, str] = {}
    emails: dict[str, str] = {}
    creds: set[str] = set()
    for pg in pages:
        if not (200 <= pg["status"] < 400 and pg["body"]):
            continue
        rec["pagesChecked"].append(pg["final"])
        text = visible_text(pg["body"])
        for slug, mode, rxs in MATCHERS:
            hit = all(r.search(text) for r in rxs) if mode == "all" else any(r.search(text) for r in rxs)
            if hit and slug not in found_pep:
                found_pep[slug] = pg["final"]
        if not rec["telehealth"] and TELEHEALTH_RE.search(text):
            rec["telehealth"], rec["telehealthUrl"] = True, pg["final"]
        if rec["hours"] is None:
            rec["hours"] = extract_hours(pg["body"])
        for e in extract_emails(pg["body"]):
            emails.setdefault(e, pg["final"])
        for m in CRED_RE.finditer(text):
            creds.add(re.sub(r"[.\s]", "", m.group(1)).upper())
        for m in CRED_CONTEXT_RE.finditer(text):
            creds.add(m.group(1).lower())
    rec["peptides"] = sorted(found_pep)
    rec["peptideSources"] = found_pep
    rec["emails"] = [{"email": e, "foundOn": u} for e, u in emails.items()][:12]
    rec["credentials"] = sorted(creds)
    return rec


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--private-out", required=True)
    ap.add_argument("--cache-dir", default=str(ROOT / "data/site-scan-cache"))
    ap.add_argument("--workers", type=int, default=24)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--offline", action="store_true")
    a = ap.parse_args()
    cache_dir = Path(a.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    providers = [p for p in json.loads(PROVIDERS.read_text(encoding="utf-8")) if p.get("website")]
    if a.only:
        providers = [p for p in providers if p["slug"] in set(a.only)]
    if a.limit:
        providers = providers[: a.limit]
    print(f"scanning {len(providers)} provider websites", flush=True)
    results: list[dict] = []
    limits = httpx.Limits(max_connections=a.workers * 2, max_keepalive_connections=a.workers)
    with httpx.Client(headers={"User-Agent": UA, "Accept": "text/html,*/*;q=0.5"}, follow_redirects=True,
                      timeout=15.0, limits=limits, verify=False) as client:
        with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
            futs = {ex.submit(scan, p, client, cache_dir, a.offline): p for p in providers}
            for i, f in enumerate(cf.as_completed(futs), 1):
                try:
                    results.append(f.result())
                except Exception as e:
                    p = futs[f]
                    results.append({"slug": p["slug"], "alive": False, "error": f"crash:{type(e).__name__}", "checkedAt": None})
                if i % 100 == 0:
                    print(f"  {i}/{len(providers)}", flush=True)
    results.sort(key=lambda r: r["slug"])
    priv = Path(a.private_out)
    priv.parent.mkdir(parents=True, exist_ok=True)
    with priv.open("w", encoding="utf-8") as fh:
        for r in results:
            fh.write(json.dumps(r) + "\n")
    def no_userinfo(v):
        if isinstance(v, str):
            return None if "@" in v else v
        if isinstance(v, list):
            return [x for x in v if not (isinstance(x, str) and "@" in x)]
        if isinstance(v, dict):
            return {k: x for k, x in v.items() if not (isinstance(x, str) and "@" in x)}
        return v
    public = {
        r["slug"]: {k: no_userinfo(r.get(k)) for k in ("checkedAt", "alive", "httpStatus", "finalHost", "peptides", "peptideSources", "telehealth", "telehealthUrl", "hours", "pagesChecked")}
        for r in results
    }
    if not a.only and not a.limit:
        PUBLIC_OUT.write_text(json.dumps(public, indent=1, sort_keys=True), encoding="utf-8")
    alive = sum(1 for r in results if r.get("alive"))
    with_email = sum(1 for r in results if r.get("emails"))
    print(json.dumps({"scanned": len(results), "alive": alive, "withEmail": with_email,
                      "withPeptides": sum(1 for r in results if r.get("peptides")),
                      "telehealth": sum(1 for r in results if r.get("telehealth")),
                      "withHours": sum(1 for r in results if r.get("hours"))}), flush=True)


if __name__ == "__main__":
    import warnings
    warnings.filterwarnings("ignore")
    sys.exit(main())
