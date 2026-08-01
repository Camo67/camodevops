#!/usr/bin/env bash
# workstation-setup.sh — run on EACH workstation (bertha, cam, etc.).
# Does: SSH key gen, ~/.ssh/config alias 'ssh camo', Samba mount, Node + Claude Code, git config.
# Usage:  bash workstation-setup.sh [CAMODEVOPS_IP]
#   CAMODEVOPS_IP defaults to 192.168.18.187 (camodevops WiFi IP).
set -euo pipefail

CAM_IP="${1:-192.168.18.187}"
SAMBA_USER="${SAMBA_USER:-camo}"
MOUNT="/mnt/camodevops"

echo "== SSH key (ed25519) =="
mkdir -p "$HOME/.ssh"; chmod 700 "$HOME/.ssh"
if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
  ssh-keygen -t ed25519 -N "" -C "$(hostname)"
fi

echo "== ~/.ssh/config alias 'camo' =="
grep -q 'Host camo' "$HOME/.ssh/config" 2>/dev/null || cat >> "$HOME/.ssh/config" <<EOF

Host camo
    HostName $CAM_IP
    User $SAMBA_USER
    IdentityFile ~/.ssh/id_ed25519
EOF
chmod 600 "$HOME/.ssh/config" 2>/dev/null || true

echo "== Samba client mount =="
sudo apt-get update -qq
sudo apt-get install -y cifs-utils
sudo mkdir -p "$MOUNT"
grep -q "$MOUNT" /etc/fstab 2>/dev/null || \
  echo "//$CAM_IP/shared $MOUNT cifs username=$SAMBA_USER,uid=$(id -u),gid=$(id -g),noauto,user 0 0" | sudo tee -a /etc/fstab
echo "(mount manually with: mount $MOUNT  — prompts for Samba password)"

echo "== Node + Claude Code =="
if [ ! -d "$HOME/.nvm" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install --lts
npm install -g @anthropic-ai/claude-code 2>/dev/null || true

echo "== git config =="
git config --global user.name  "${GIT_NAME:-$(whoami)}"
git config --global user.email "${GIT_EMAIL:-$(whoami)@local}"
git config --global init.defaultBranch main

echo "DONE workstation-setup.sh for $(hostname)"
