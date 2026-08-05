#!/usr/bin/env python3
"""CamOdevOps — SAPS-ready evidence dossier generator.

Consent-based, law-enforcement-handoff ONLY. No vigilante action.
Compiles de-identified case data into a tamper-evident, dated markdown
dossier suitable for chain-of-custody handoff to SAPS / sector policing.

Run:
    python evidence/case_writer.py --case case-2026-0001.json \
        --out ~/Documents/Obsidian/CCB/cases/

Input JSON schema (minimal):
{
  "case_id": "case-2026-0001",
  "received_at": "2026-08-05T10:00:00Z",
  "complainant": {"consent": true, "ref": "anon-<token>"},
  "iocs": {...},                 # from Ollama extraction
  "summary": "...",
  "officer_licensed": false      # PSIRA/PI gating flag
}
"""
from __future__ import annotations
import argparse, json, hashlib, datetime, pathlib, sys


def build_dossier(case: dict) -> str:
    if not case.get("complainant", {}).get("consent"):
        raise SystemExit("Refusing: complainant consent not recorded.")
    cid = case.get("case_id", "unknown")
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    iocs = case.get("iocs", {})
    lines = [
        f"# Case {cid} — CamOdevOps Evidence Dossier",
        "",
        f"- **Generated (UTC):** {now}",
        f"- **Complainant ref:** {case['complainant'].get('ref','anon')} (consent: YES)",
        f"- **Investigator licensed (PSIRA/PI):** {case.get('officer_licensed', False)}",
        f"- **Summary:** {case.get('summary','')}",
        "",
        "## Indicators of Compromise",
        f"- Phone numbers: {', '.join(iocs.get('phone_numbers', [])) or '—'}",
        f"- Bank accounts: {', '.join(iocs.get('bank_accounts', [])) or '—'}",
        f"- Bank names: {', '.join(iocs.get('bank_names', [])) or '—'}",
        f"- Crypto wallets: {', '.join(iocs.get('crypto_wallets', [])) or '—'}",
        f"- URLs: {', '.join(iocs.get('urls', [])) or '—'}",
        f"- Social handles: {', '.join(iocs.get('social_handles', [])) or '—'}",
        f"- Aliases: {', '.join(iocs.get('scammer_aliases', [])) or '—'}",
        f"- Amounts (ZAR): {', '.join(map(str, iocs.get('amounts_zar', []))) or '—'}",
        f"- Tactics: {', '.join(case.get('tactics_observed', [])) or '—'}",
        f"- Risk flags: {', '.join(case.get('risk_flags', [])) or '—'}",
        "",
        "## Handoff",
        "- **This dossier is intelligence only.** No physical action, recovery,",
        "  or interdiction is authorised or implied.",
        "- Forward to SAPS / sector policing forum with a Section 205 request",
        "  where subscriber/location data is required.",
        "- Maintain chain of custody: record each transfer (who/when/how).",
        "",
        f"<!-- sha256:{hashlib.sha256(json.dumps(case, sort_keys=True).encode()).hexdigest()[:16]} -->",
    ]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--case", required=True, help="path to case JSON")
    ap.add_argument("--out", default="~/Documents/Obsidian/CCB/cases")
    args = ap.parse_args()
    case = json.loads(pathlib.Path(args.case).read_text())
    dossier = build_dossier(case)
    out = pathlib.Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{case.get('case_id','case')}.md"
    path.write_text(dossier)
    print(f"WROTE {path} ({len(dossier)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
