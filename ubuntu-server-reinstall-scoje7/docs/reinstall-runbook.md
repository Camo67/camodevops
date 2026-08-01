# Reinstall Runbook — camodevops

Reproducible rebuild of the camodevops server from bare metal.

## 0. OS install
- Ubuntu Server 26.04 (or 24.04 on bertha-class boxes)
- User `camo`, hostname `camodevops`
- Connect to `VC-2508-59` WiFi during install (or wire temporarily)

## 1. Grant passwordless sudo (so the agent can administer)
```bash
echo 'camo ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/camo-nopasswd
```

## 2. Enroll GitHub SSH key (so the box can push to the repo)
```bash
ssh-keygen -t ed25519 -N "" -C "camodevops"
cat ~/.ssh/id_ed25519.pub   # add this to GitHub: Settings -> SSH keys
ssh-keyscan -t ed25519,rsa github.com >> ~/.ssh/known_hosts
```

## 3. Clone the setup repo
```bash
git clone git@github.com:Camo67/camodevops.git
cd camodevops
```

## 4. Run the orchestrator
```bash
bash ubuntu-server-reinstall-scoje7/server-setup.sh
```
This runs, in order:
1. `mkdirs.sh` — folder tree (`CamOdevOps/`, `shared/`, `projects/`, `backups/`, `logs/`)
2. `devtools-setup.sh` — nvm+Node LTS, Claude Code CLI, nvim, tmux, zsh, git
3. `samba-setup.sh` — Samba shares `shared` (r/w) + `projects` (r/o), LAN-only
4. installs the `netfailover` systemd timer (wired → VC-2508-59 → phone hotspot)

## 5. Post-install (manual)
- **SSH hub**: enroll client keys with `~/ssh-tools/add-ssh-key` (see ssh-hub-guide.md)
- **MicroK8s**: `usermod -aG microk8s camo`, pin node-ip, `microk8s add-node` for others
  (see microk8s-cluster.md)
- **Barrier**: bertha runs `barriers` (server); camodevops runs
  `barrierc --no-tray --name cam <BERTHA_IP>` (client)
- **Samba password**: set with `sudo smbpasswd -a camo` if not prompted during step 4

## 6. Verify
```bash
ip -4 addr show | grep inet | grep -v 127        # has an IP
microk8s kubectl get nodes                        # cluster healthy
ls ~/camodevops/CamOdevOps/business               # folder tree exists
systemctl is-enabled camodevops-netfailover.timer # failover active
```
