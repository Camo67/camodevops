#!/usr/bin/env bash
# samba-setup.sh — LAN file sharing from camodevops
# Shares ~/shared (general) and ~/camodevops (projects, read-only).
# Run as camo67. Requires sudo. Safe to re-run.

set -euo pipefail

SAMBA_USER="${SAMBA_USER:-camo67}"
SHARE_ROOT="$HOME/shared"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        camodevops — Samba File Share         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Install Samba ──────────────────────────────────────────────────────────
info "Installing Samba..."
sudo apt-get update -qq
sudo apt-get install -y -qq samba samba-common-bin
success "Samba installed"

# ── 2. Create share directory ─────────────────────────────────────────────────
info "Creating share directories..."
mkdir -p "$SHARE_ROOT"/{docs,assets,vault}
chmod 775 "$SHARE_ROOT"
success "Share root: $SHARE_ROOT"

# ── 3. UFW rules for Samba ────────────────────────────────────────────────────
info "Opening Samba ports (LAN only)..."
sudo ufw allow from 192.168.18.0/24 to any port 445  comment 'Samba SMB (LAN)'
sudo ufw allow from 192.168.18.0/24 to any port 139  comment 'Samba NetBIOS (LAN)'
success "Firewall rules added"

# ── 4. Samba config ───────────────────────────────────────────────────────────
info "Writing /etc/samba/smb.conf..."
sudo tee /etc/samba/smb.conf > /dev/null <<SMBCONF
[global]
   workgroup = CAMONET
   server string = camodevops
   server role = standalone server
   log file = /var/log/samba/log.%m
   max log size = 1000
   logging = file
   panic action = /usr/share/samba/panic-action %d
   obey pam restrictions = yes
   unix password sync = yes
   passwd program = /usr/bin/passwd %u
   passwd chat = *Enter\snew\s*\spassword:* %n\n *Retype\snew\s*\spassword:* %n\n *password\supdated\ssuccessfully* .
   pam password change = yes
   map to guest = bad user
   usershare allow guests = no

# ── shared — general LAN share (read/write for samba user) ───────────────────
[shared]
   path = $SHARE_ROOT
   valid users = $SAMBA_USER
   read only = no
   browseable = yes
   create mask = 0664
   directory mask = 0775
   comment = CamoDevOps shared files

# ── projects — camodevops repo (read-only) ───────────────────────────────────
[projects]
   path = $HOME/camodevops
   valid users = $SAMBA_USER
   read only = yes
   browseable = yes
   comment = camodevops project (read-only)
SMBCONF
success "smb.conf written"

# ── 5. Set Samba password ─────────────────────────────────────────────────────
echo ""
warn "Set a Samba password for user '$SAMBA_USER' (used to mount from other machines):"
sudo smbpasswd -a "$SAMBA_USER"

# ── 6. Enable + restart Samba ────────────────────────────────────────────────
info "Enabling Samba service..."
sudo systemctl enable smbd nmbd
sudo systemctl restart smbd nmbd
success "Samba running"

# ── 7. Mount instructions ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        Mount from other machines             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Linux (bertha / cam):"
echo "    sudo mount -t cifs //192.168.18.187/shared ~/mnt/camo \\"
echo "      -o username=$SAMBA_USER,uid=\$(id -u),gid=\$(id -g)"
echo ""
echo "  Persistent mount — add to /etc/fstab:"
echo "    //192.168.18.187/shared  /mnt/camo  cifs  username=$SAMBA_USER,password=<pw>,uid=1000,gid=1000,iocharset=utf8  0  0"
echo ""
echo "  macOS Finder:  Go → Connect to Server → smb://192.168.18.187/shared"
echo "  Windows:       \\\\192.168.18.187\\shared"
echo ""
success "Samba setup complete."
