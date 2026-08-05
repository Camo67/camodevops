# CamOdevOps — Security Checklist

> Maintained by the Hermes agent. Status reflects VERIFIED state on camodevops,
> not assumptions. Last reviewed: 2026-08-03.
> Owner of security items: **Mr Devious** (see team/members.md).

Legend: ✅ done · 🟡 partial / caveat · ⛔ not done · ⏳ pending decision

## 1. Access & Identity
| Item | Status | Notes |
|------|--------|-------|
| SSH password auth disabled | ✅ | `99-no-password.conf`; key-only. Verified 2026-08-01 |
| SSH keys enrolled | ✅ | 8 keys (7× `gh:camo67` + `bertha`). See `~/ssh-tools/` |
| SSH hub (central auth) | ✅ | sshd :22 v4+v6, password OFF |
| sudo policy (camo NOPASSWD) | ✅ | `/etc/sudoers.d/camo-nopasswd` — agent can run privileged unprompted (trusted personal box) |
| MFA on Telegram/Hermes | 🟡 | Telegram account-level; not enforced at bus layer |
| Unique per-member creds | ⛔ | Only @camo + agent exist; Mr Devious creds TBD |

## 2. Network & Firewall (Calico-aware)
| Item | Status | Notes |
|------|--------|-------|
| UFW enabled | ⛔ **INTENTIONALLY OFF** | Enabling UFW default-deny breaks MicroK8s/Calico pod networking. Documented risk. |
| Samba LAN-restricted | ✅ | `hosts allow = 192.168.18.0/24` |
| code-server exposure | 🟡 | Bound `0.0.0.0:4040`, password auth, **now TLS** (self-signed). LAN only. |
| KVM/libvirt NAT (virbr0) | ✅ | Default NAT network **disabled + non-autostart** (Calico-safe) |
| Cluster CNI (Calico) | ✅ | `vxlan.calico` + `cali*` interfaces UP, untouched by KVM install |
| Ingress TLS (web app on main) | ⏳ | nginx.conf exists on `main`; cert provisioning pending |

## 3. Services Hardening
| Item | Status | Notes |
|------|--------|-------|
| code-server TLS | ✅ | Self-signed cert applied 2026-08-03; `cert: true` + `cert-key` set |
| code-server auth | ✅ | `auth: password` (random 32-hex). Rotate via config.yaml |
| Redis exposure | 🟡 | Bound localhost:6379 (no external bind). Verify no `0.0.0.0` bind |
| API bus (:8000) | 🟡 | Bound 127.0.0.1 in tests; not yet exposed externally. Add auth before any WAN exposure |
| Secrets in repo | ✅ | No plaintext secrets committed; `.env.example` only, `.env` gitignored |

## 4. Monitoring & Audit
| Item | Status | Notes |
|------|--------|-------|
| SSH login auditing | 🟡 | Standard systemd journal; no alerting wired |
| Central Context Bus ledger | ✅ | Append-only markdown audit of all bus events (ccb/ledger_worker) |
| Fail2ban / intrusion detection | ⛔ | Not installed |
| Vulnerability scanning | ⛔ | No automated CVE scan scheduled |
| Regular security review | ⏳ | Assign to Mr Devious (cadence TBD) |

## 5. Open Security Tasks (assigned)
- **Mr Devious**: confirm handle/GitHub; perform first full security pass (items marked ⛡/⏳ above).
- **@camo**: decide whether code-server needs a public DNS + trusted cert vs LAN-only.
- **Hermes**: verify Redis is not bound to `0.0.0.0`; add API-bus auth before any external exposure.

## 6. Cloud IAM — AccessKey Rotation Runbook (Alibaba Cloud RAM)
> Source: RAM access-key audit remediation (scenarios 1–3). Owner: Mr Devious.
> **Rule #1 — never use a primary/root account AccessKey in code or chat.** Always run
> workloads under a scoped RAM sub-user key. (This is also why live PATs/tokens must never
> be pasted into group chat.)

| Scenario | Trigger | Action | Wait |
|----------|---------|--------|------|
| S1 | Primary key **never used** | Disable now; if quiet 90d → delete | 90d |
| S2 | Primary key **unused ≥90d** | Confirm NOT in code/apps → disable; if still referenced, relocate/reassign first → delete after 90d quiet | 90d |
| S3 | Key **used within 90d** | Create RAM user (Open API Call Access) + `AdministratorAccess` → swap key in code → test env → verify → prod deploy → disable primary → observe → delete after 90d | 90d |

**Verification commands (run from a host with the RAM creds in a FILE, never pasted):**
- List keys: `aliyun ram ListAccessKeys --UserPrincipalName <ram-user>@<account>.onaliyun.com`
- Create sub-user key: `aliyun ram CreateAccessKey --UserPrincipalName ...`
- Disable: `aliyun ram UpdateAccessKey --UserAccessKeyId <id> --Status Inactive`

**Automation (planned):** n8n monitor polls `ListAccessKeys` → flags keys >90d/unused →
emits a security event to the **Central Context Bus** → appended to the **Obsidian ledger**
as a rotation action item. (Build blocked until RAM creds supplied via file, not chat.)

## 7. Component Status (verified 2026-08-05)
- **Central Context Bus**: ✅ REVIVED — bus `:8000` live, Redis 8.0.5, ledger + agent harness
  running, writing to `~/Documents/Obsidian/CCB/ledger.md`.
- **Obsidian vault**: ✅ created at `~/Documents/Obsidian/CCB/` (ledger + `cases/`).
- **Weft (mvp)**: 🟡 cloned to `~/camodevops/weft` as vendored reference. **NOT run here** —
  requires Docker (Restate + Postgres). Run on bertha/HP when available.
- **n8n**: ⏳ installing via `npm -g` (slow network). Will run on-demand; do NOT co-run with
  Ollama under load (RAM-limited box).
- **Ollama**: ⏳ installing via official script (apt package absent). Small model (qwen2.5:1.5b)
  to fit ~1 GB RAM; CPU-only.

## How to update
Edit this file on `claude-setup`, commit, push. Re-run verification commands before
flipping a status from ⏳/⛔ to ✅.
