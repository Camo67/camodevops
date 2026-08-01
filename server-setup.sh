#!/usr/bin/env bash
# server-setup.sh — post-install bootstrap for the camoflo Ubuntu Server
# Run once as the regular user (camo67) immediately after a fresh Ubuntu Server install.
# Requires sudo access. Safe to re-run.

set -euo pipefail

REPO_URL="https://github.com/Camo67/camodevops.git"
REPO_DIR="$HOME/camodevops"
HARNESS_DIR="$HOME/agentic-harness"

# ── colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()     { echo -e "${RED}[FAIL]${NC} $*" >&2; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  camodevops — Server Setup (camodevops box)  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. System update ───────────────────────────────────────────────────────────
info "Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
sudo apt-get install -y -qq \
    curl git ufw fail2ban unattended-upgrades \
    ca-certificates gnupg lsb-release python3
success "System packages up to date"

# ── 2. Docker (official apt method — not snap) ─────────────────────────────────
if ! command -v docker &>/dev/null; then
    info "Installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    success "Docker installed — log out and back in for group membership to take effect"
    warn "If this is your first run, start a new shell or run: newgrp docker"
else
    success "Docker already installed ($(docker --version))"
fi

# ── 3. Firewall (UFW) ──────────────────────────────────────────────────────────
info "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
# Internal-only: allow from LAN (192.168.18.0/24) for debug ports
sudo ufw allow from 192.168.18.0/24 to any port 8080 comment 'web (LAN only)'
sudo ufw allow from 192.168.18.0/24 to any port 8081 comment 'harness (LAN only)'
sudo ufw allow from 192.168.18.0/24 to any port 11434 comment 'ollama (LAN only)'
sudo ufw --force enable
success "UFW enabled — status:"
sudo ufw status numbered

# ── 4. fail2ban ────────────────────────────────────────────────────────────────
info "Enabling fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
success "fail2ban running"

# ── 5. Unattended security updates ────────────────────────────────────────────
info "Enabling unattended security updates..."
sudo dpkg-reconfigure -f noninteractive unattended-upgrades
success "Automatic security updates configured"

# ── 6. Clone / update the repo ────────────────────────────────────────────────
if [ -d "$REPO_DIR/.git" ]; then
    info "Repo already present — pulling latest..."
    git -C "$REPO_DIR" pull origin main
else
    info "Cloning camodevops repo..."
    git clone "$REPO_URL" "$REPO_DIR"
fi
success "Repo ready at $REPO_DIR"

# ── 7. .env file ──────────────────────────────────────────────────────────────
if [ ! -f "$REPO_DIR/.env" ]; then
    cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
    warn ".env created from template — fill in your secrets before starting the stack:"
    echo "      nano $REPO_DIR/.env"
else
    success ".env already exists — skipping"
fi

# ── 8. SSL directory ──────────────────────────────────────────────────────────
SSL_DIR="$REPO_DIR/ssl"
if [ ! -d "$SSL_DIR" ]; then
    mkdir -p "$SSL_DIR"
    warn "SSL directory created at $SSL_DIR"
    warn "Place your certificates there:"
    echo "      $SSL_DIR/fullchain.pem"
    echo "      $SSL_DIR/privkey.pem"
    echo "  or run: sudo certbot certonly --standalone -d camo.devops.online"
else
    success "SSL directory already present"
fi

# ── 9. Agentic harness path ────────────────────────────────────────────────────
if [ ! -d "$HARNESS_DIR" ]; then
    warn "Agentic harness not found at $HARNESS_DIR"
    warn "Clone it manually, then set HARNESS_DIR in .env:"
    echo "      HARNESS_DIR=$HARNESS_DIR"
else
    success "Agentic harness found at $HARNESS_DIR"
fi

# ── 10. Summary ───────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║           Setup complete — next steps         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  1. Fill in secrets:        nano $REPO_DIR/.env"
echo "  2. Add SSL certs:          $SSL_DIR/"
echo "  3. Clone agentic harness:  git clone <harness-repo> $HARNESS_DIR"
echo "  4. Build & start stack:    cd $REPO_DIR && ./deploy.sh build && ./deploy.sh up"
echo "  5. If new docker group:    newgrp docker  (or log out/in first)"
echo ""
success "All done."
