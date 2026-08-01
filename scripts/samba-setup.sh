#!/usr/bin/env bash
# samba-setup.sh — Samba file sharing on camodevops.
# Creates two shares: 'shared' (r/w) and 'projects' (r/o).
# SAFETY: this box is a Kubernetes/Calico node. We do NOT enable a default-deny
# UFW (that would break pod networking). Instead we (a) leave the host firewall
# off and (b) restrict Samba to the LAN subnet via Samba's own 'hosts allow'.
# If you want UFW, scope it to 192.168.18.0/24 only — never a blanket deny.
set -euo pipefail

BASE="${CAMODEVOPS_HOME:-$HOME/camodevops}"
LAN_SUBNET="${LAN_SUBNET:-192.168.18.0/24}"
SAMBA_USER="${SAMBA_USER:-camo}"

echo "== install samba =="
sudo apt-get update -qq
sudo apt-get install -y samba

mkdir -p "$BASE/shared" "$BASE/projects"
chmod 2775 "$BASE/shared" "$BASE/projects"

echo "== write smb.conf includes =="
sudo tee /etc/samba/smb.conf.d/camodevops.conf >/dev/null <<EOF
[shared]
   path = $BASE/shared
   browseable = yes
   read only = no
   guest ok = no
   hosts allow = $LAN_SUBNET
   valid users = $SAMBA_USER

[projects]
   path = $BASE/projects
   browseable = yes
   read only = yes
   guest ok = no
   hosts allow = $LAN_SUBNET
   valid users = $SAMBA_USER
EOF

echo "== ensure samba user exists (set a Samba password) =="
sudo smbpasswd -e "$SAMBA_USER" 2>/dev/null || true
if ! sudo pdbedit -L | grep -q "^$SAMBA_USER:"; then
  sudo smbpasswd -a "$SAMBA_USER"
fi

echo "== restart smbd/nmbd =="
sudo systemctl enable --now smbd nmbd

echo "DONE samba-setup.sh — shares 'shared' (r/w) and 'projects' (r/o) on LAN only."
echo "Test from a workstation: smbclient -L //$(hostname) -U $SAMBA_USER"
