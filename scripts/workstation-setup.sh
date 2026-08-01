#!/usr/bin/env bash
# workstation-setup.sh — run on bertha / cam to connect into camodevops
# Sets up SSH alias, mounts the Samba share, installs Claude Code + dev tools.
# Run as your regular user on the workstation. Requires sudo for mount.

set -euo pipefail

SERVER_IP="${SERVER_IP:-192.168.18.187}"
SERVER_USER="${SERVER_USER:-camo67}"
SAMBA_SHARE="shared"
MOUNT_POINT="$HOME/mnt/camo"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      Workstation → camodevops Setup          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Server: $SERVER_IP"
echo ""

# ── 1. SSH key check ──────────────────────────────────────────────────────────
info "Checking for SSH keypair..."
if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
    info "Generating ED25519 keypair..."
    ssh-keygen -t ed25519 -C "$(hostname)-$(date +%Y%m%d)" -f "$HOME/.ssh/id_ed25519"
    success "Keypair generated"
else
    success "SSH keypair already exists"
fi

echo ""
info "Your public key (copy this to camodevops authorized_keys if not done yet):"
echo ""
cat "$HOME/.ssh/id_ed25519.pub"
echo ""

# ── 2. SSH config alias ───────────────────────────────────────────────────────
SSH_CONFIG="$HOME/.ssh/config"
touch "$SSH_CONFIG"
chmod 600 "$SSH_CONFIG"

if ! grep -q "Host camo$" "$SSH_CONFIG" 2>/dev/null; then
    info "Adding SSH alias 'camo' to ~/.ssh/config..."
    cat >> "$SSH_CONFIG" <<SSH

Host camo
    HostName $SERVER_IP
    User $SERVER_USER
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
SSH
    success "SSH alias added — connect with:  ssh camo"
else
    success "SSH alias 'camo' already in ~/.ssh/config"
fi

# ── 3. Test SSH connection ────────────────────────────────────────────────────
info "Testing SSH connection to camodevops..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new camo "echo ok" 2>/dev/null; then
    success "SSH to camodevops working"
else
    warn "SSH test failed — add your public key on camodevops first:"
    echo "      On camodevops: echo '$(cat "$HOME/.ssh/id_ed25519.pub")' >> ~/.ssh/authorized_keys"
fi

# ── 4. Samba mount ────────────────────────────────────────────────────────────
info "Setting up Samba mount..."
sudo apt-get install -y -qq cifs-utils 2>/dev/null || true
mkdir -p "$MOUNT_POINT"

if mountpoint -q "$MOUNT_POINT"; then
    success "Already mounted at $MOUNT_POINT"
else
    warn "Mounting //192.168.18.187/$SAMBA_SHARE → $MOUNT_POINT"
    warn "Enter your Samba password when prompted:"
    sudo mount -t cifs "//$SERVER_IP/$SAMBA_SHARE" "$MOUNT_POINT" \
        -o "username=$SERVER_USER,uid=$(id -u),gid=$(id -g),iocharset=utf8" \
        && success "Mounted at $MOUNT_POINT" \
        || warn "Mount failed — run samba-setup.sh on camodevops first, then retry"
fi

# ── 5. Node.js + Claude Code ─────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    info "Installing nvm + Node.js LTS..."
    export NVM_DIR="$HOME/.nvm"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # shellcheck disable=SC1090
    source "$NVM_DIR/nvm.sh"
    nvm install --lts && nvm use --lts && nvm alias default node
    success "Node.js $(node --version) installed"
fi

if ! command -v claude &>/dev/null; then
    info "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code
    success "Claude Code installed"
else
    success "Claude Code already installed"
fi

# ── 6. Git config ─────────────────────────────────────────────────────────────
info "Configuring git..."
git config --global user.name  "camo67"
git config --global user.email "devries.cameron20@gmail.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
success "Git configured"

# ── 7. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         Workstation ready                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  ssh camo                      → SSH into camodevops"
echo "  ls $MOUNT_POINT               → browse shared files"
echo "  claude                        → start Claude Code"
echo ""
success "Done."
