# camodevops provisioning runbook

Bring the **camodevops** server online as the MicroK8s control-plane (wired `192.168.18.187`) with dev tooling and a LAN Samba share, then connect each workstation to the share.

The setup scripts live in this repo under `scripts/`. The bootstrap is `server-setup.sh` at the repo root.

## Network facts

| Host | LAN IP | User | Role |
|---|---|---|---|
| camodevops (wired) | 192.168.18.187 | camo67 | MicroK8s control-plane, Samba server |
| camodevops (wifi) | 192.168.18.190 | camo67 | secondary NIC |
| bertha | 192.168.18.174 | bertha | workstation |
| camoflo | 192.168.18.8 | camoflo | workstation + k8s worker |
| camhp | 192.168.18.195 | cam | workstation |

MicroK8s node-ip is pinned to `.187` via `--node-ip=192.168.18.187` in `/var/snap/microk8s/current/args/kubelet`. The router static-DHCP reservation keeps it stable across reboots.

## Prerequisites (manual)

1. Power on the camodevops box.
2. Router: static DHCP reservation for camodevops's **wired** NIC MAC → `192.168.18.187` (reserve the wired MAC only; WiFi is `.190`).

## On a workstation: SSH config (bertha)

The `camodevops` alias must point at `.187` / user `camo67`:

```
Host camodevops caamodevops
    HostName 192.168.18.187
    User camo67
    IdentityFile ~/.ssh/id_ed25519
```

Verify: `ssh camodevops 'hostname; hostname -I'`. If `camo67` is rejected, the box may still use the older `camo` user — adjust `User` accordingly.

## On the server (camodevops)

```bash
# 1. get the repo (scripts ship with it)
if [ -d ~/camodevops ]; then git -C ~/camodevops pull; else git clone https://github.com/Camo67/camodevops.git ~/camodevops; fi

# 2. bootstrap check — if any are missing, run server-setup.sh first
docker --version && systemctl is-active fail2ban && ls ~/camodevops/.env
#   ^ missing → bash ~/camodevops/server-setup.sh   (Docker, ufw, fail2ban, unattended-upgrades)

# 3. run order (all idempotent, set -euo pipefail)
bash ~/camodevops/scripts/mkdirs.sh          # scaffold ~/shared, ~/projects, ~/backups, ~/logs ...
bash ~/camodevops/scripts/devtools-setup.sh  # sudo: apt dev tools, nvm+Node, claude-code, zsh
bash ~/camodevops/scripts/samba-setup.sh     # sudo: samba, exports [shared] rw + [projects] ro; prompts for smbpasswd
```

Samba exports:
- `[shared]` → `~/shared` (read/write)
- `[projects]` → `~/camodevops` (read-only)

ufw opens `445`/`139` from `192.168.18.0/24`.

## On each workstation (bertha, camhp, camoflo)

```bash
if [ -d ~/camodevops ]; then git -C ~/camodevops pull; else git clone https://github.com/Camo67/camodevops.git ~/camodevops; fi
bash ~/camodevops/scripts/workstation-setup.sh   # sudo: cifs-utils, mounts //192.168.18.187/shared at ~/mnt/camo, adds `camo` ssh alias
```

Access fixes before bertha can drive the remote boxes:
- **camoflo** — bertha's key isn't authorized; install bertha's pubkey, or run the script locally on camoflo.
- **camhp** — host key changed: `ssh-keygen -R 192.168.18.195` then reconnect.

## Verify

```bash
# server
ssh camodevops 'systemctl is-active smbd nmbd; sudo ufw status; docker --version; ls ~/shared'

# samba round-trip (from a workstation)
echo hi > ~/mnt/camo/t.txt
ssh camodevops 'cat ~/shared/t.txt'

# node-ip stable across reboot
ssh camodevops 'microk8s kubectl get nodes -o wide'   # node shows 192.168.18.187
```

## Notes

- Scripts are idempotent; safe to re-run. `samba-setup.sh` rewrites `smb.conf` and re-prompts the Samba password on each run.
- **`samba-setup.sh` sets `unix password sync = yes`** — the Samba password you enter also becomes your unix login password. Choose it deliberately.
- **`server-setup.sh` runs `sudo ufw --force reset` on every invocation** — that wipes any custom firewall rules. Only re-run it on a fresh box.
- `server-setup.sh` header says "camoflo" but the body provisions camodevops — cosmetic.
- Username may be `camo67` (scripts + `server-reinstall.md`) or `camo` (`ssh-hub.md`); verify on first connect.
- MicroK8s node-ip pinning itself is documented in `docs/k8s-cluster.md`, separate from these scripts.
