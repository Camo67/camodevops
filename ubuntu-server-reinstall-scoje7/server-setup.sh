#!/usr/bin/env bash
# server-setup.sh — top-level orchestrator for a fresh camodevops install.
# Run AFTER: OS installed + NOPASSWD sudo granted + GitHub SSH key enrolled.
# Order: folder tree -> dev tools -> samba -> network failover watchdog.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS="$REPO_ROOT/ubuntu-server-reinstall-scoje7/scripts"

echo "== camodevops server-setup =="
echo "repo root: $REPO_ROOT"

echo "== 1/4 folder tree =="
bash "$SCRIPTS/mkdirs.sh"

echo "== 2/4 dev tools (Node LTS, Claude Code, nvim, tmux, zsh, git) =="
bash "$SCRIPTS/devtools-setup.sh"

echo "== 3/4 samba file sharing (shared r/w, projects r/o) =="
bash "$SCRIPTS/samba-setup.sh"

echo "== 4/4 network failover watchdog (wired -> VC-2508-59 -> phone hotspot) =="
sudo cp "$SCRIPTS/camodevops-netfailover.service" "$SCRIPTS/camodevops-netfailover.timer" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now camodevops-netfailover.timer
echo "failover timer: $(systemctl is-enabled camodevops-netfailover.timer 2>/dev/null || echo unknown)"

echo "== DONE. See docs/ for the reinstall runbook, SSH hub guide, MicroK8s doc. =="
