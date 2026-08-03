#!/usr/bin/env bash
# anydesk-setup.sh — install AnyDesk from a .deb in the home directory
# Run as camo67 on camodevops. Safe to re-run.

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()     { echo -e "${RED}[FAIL]${NC} $*" >&2; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        camodevops — AnyDesk Setup            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Locate the .deb ────────────────────────────────────────────────────────
DEB=$(ls "$HOME"/anydesk*.deb 2>/dev/null | head -1 || true)
if [ -z "$DEB" ]; then
    die "No anydesk*.deb found in $HOME — download it first from https://anydesk.com/en/downloads/linux"
fi
info "Found installer: $DEB"

# ── 2. Install ────────────────────────────────────────────────────────────────
info "Installing AnyDesk..."
sudo apt-get install -y -qq "$DEB" 2>/dev/null \
    || sudo dpkg -i "$DEB" && sudo apt-get install -f -y -qq
success "AnyDesk installed ($(anydesk --version 2>/dev/null || echo 'version unknown'))"

# ── 3. Enable and start the service ──────────────────────────────────────────
info "Enabling anydesk service..."
sudo systemctl enable anydesk
sudo systemctl start  anydesk
success "anydesk service running"

# ── 4. UFW — AnyDesk uses port 7070 (TCP+UDP) ────────────────────────────────
info "Opening UFW port 7070 (AnyDesk)..."
sudo ufw allow 7070 comment 'AnyDesk'
success "UFW updated"

# ── 5. Show AnyDesk ID ────────────────────────────────────────────────────────
echo ""
info "AnyDesk address for this machine:"
anydesk --get-id 2>/dev/null || sudo anydesk --get-id 2>/dev/null || warn "Run 'anydesk --get-id' once the service is fully started"

# ── 6. Set unattended-access password (optional) ─────────────────────────────
echo ""
warn "To enable unattended access (headless remote), set a password:"
echo "      echo 'yourpassword' | sudo anydesk --set-password"
echo ""
echo "  Then on the connecting machine, use the AnyDesk ID above."
echo ""
success "AnyDesk setup done."
