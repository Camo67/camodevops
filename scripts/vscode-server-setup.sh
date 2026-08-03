#!/usr/bin/env bash
# vscode-server-setup.sh — install code-server (browser VS Code) on camodevops
# Accessible at http://192.168.18.187:4040 from any LAN machine.
# Run as camo67. Safe to re-run.

set -euo pipefail

CODE_SERVER_PORT="${CODE_SERVER_PORT:-4040}"
SERVER_IP="192.168.18.187"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      camodevops — code-server Setup          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Install code-server ────────────────────────────────────────────────────
if ! command -v code-server &>/dev/null; then
    info "Installing code-server..."
    curl -fsSL https://code-server.dev/install.sh | sh
    success "code-server installed ($(code-server --version | head -1))"
else
    success "code-server already installed ($(code-server --version | head -1))"
fi

# ── 2. Configure ──────────────────────────────────────────────────────────────
CONFIG_DIR="$HOME/.config/code-server"
CONFIG_FILE="$CONFIG_DIR/config.yaml"
mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_FILE" ]; then
    # Generate a random password on first run
    PASS=$(openssl rand -hex 16)
    cat > "$CONFIG_FILE" <<YAML
bind-addr: 0.0.0.0:${CODE_SERVER_PORT}
auth: password
password: ${PASS}
cert: false
YAML
    success "Config written to $CONFIG_FILE"
    warn "Generated password: $PASS"
    warn "Change it: nano $CONFIG_FILE"
else
    # Update port in existing config if needed
    sed -i "s/^bind-addr:.*/bind-addr: 0.0.0.0:${CODE_SERVER_PORT}/" "$CONFIG_FILE"
    success "Config already exists — port set to $CODE_SERVER_PORT"
fi

# ── 3. Systemd service ────────────────────────────────────────────────────────
info "Enabling code-server systemd service..."
sudo systemctl enable "code-server@$USER"
sudo systemctl restart "code-server@$USER"
success "code-server service running"

# ── 4. UFW — LAN-only access on port 4040 ────────────────────────────────────
info "Opening UFW port $CODE_SERVER_PORT for LAN (192.168.18.0/24)..."
sudo ufw allow from 192.168.18.0/24 to any port "$CODE_SERVER_PORT" \
    comment "code-server (LAN only)"
success "UFW updated"

# ── 5. Verify ─────────────────────────────────────────────────────────────────
sleep 2
if systemctl is-active --quiet "code-server@$USER"; then
    success "code-server is running"
else
    warn "code-server service not active — check: journalctl -u code-server@$USER -n 30"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          code-server ready                   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  URL (wired):  http://$SERVER_IP:$CODE_SERVER_PORT"
echo "  URL (WiFi):   http://192.168.18.190:$CODE_SERVER_PORT"
echo "  Password:     cat $CONFIG_FILE"
echo ""
echo "  Manage:"
echo "    sudo systemctl status  code-server@$USER"
echo "    sudo systemctl restart code-server@$USER"
echo "    journalctl -u code-server@$USER -f"
echo ""
success "Done."
