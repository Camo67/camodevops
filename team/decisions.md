# Decision Log (ADR-style)

## ADR-001 — Repo is the comms channel (not external chat)
- **Date:** 2026-08-01
- **Decision:** Use `Camo67/camodevops` `team/` markdown as the AI team channel.
- **Why:** Headless/agent-maintainable, version-controlled, no extra SaaS. GitHub Issues/Discussions optional later.
- **Status:** accepted

## ADR-002 — Calico-safe networking only
- **Date:** 2026-08-01
- **Decision:** No UFW default-deny, no NAT/DHCP gateway on camodevops; failover via watchdog script, not netplan priority.
- **Why:** Box is a MicroK8s/Calico node; firewall/DHCP breaks pod networking.
- **Status:** accepted
