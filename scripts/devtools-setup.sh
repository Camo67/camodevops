#!/usr/bin/env bash
# devtools-setup.sh — dev tools for camodevops server
# Run as camo67 after server-setup.sh has completed.
# Safe to re-run.

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        camodevops — Dev Tools Setup          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Core CLI tools ──────────────────────────────────────────────────────────
info "Installing core CLI tools..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    git tmux zsh neovim ripgrep fzf jq \
    build-essential python3 python3-pip python3-venv \
    net-tools htop tree unzip wget
success "Core CLI tools installed"

# ── 2. Node.js via nvm ────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    info "Installing nvm + Node.js LTS..."
    export NVM_DIR="$HOME/.nvm"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # shellcheck disable=SC1090
    source "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
    nvm alias default node
    success "Node.js $(node --version) installed via nvm"
else
    success "Node.js already present ($(node --version))"
fi

# ── 3. Claude Code CLI ────────────────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
    info "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code
    success "Claude Code installed ($(claude --version 2>/dev/null || echo 'check with: claude --version'))"
else
    success "Claude Code already installed"
fi

# ── 4. Git global config ──────────────────────────────────────────────────────
info "Configuring git..."
git config --global user.name  "camo67"
git config --global user.email "devries.cameron20@gmail.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.editor nvim
success "Git configured"

# ── 5. zsh as default shell ───────────────────────────────────────────────────
if [ "$SHELL" != "$(which zsh)" ]; then
    info "Setting zsh as default shell..."
    chsh -s "$(which zsh)"
    warn "Shell change takes effect on next login"
else
    success "zsh already default shell"
fi

# ── 6. tmux config ────────────────────────────────────────────────────────────
TMUX_CONF="$HOME/.tmux.conf"
if [ ! -f "$TMUX_CONF" ]; then
    info "Writing tmux config..."
    cat > "$TMUX_CONF" <<'TMUX'
set -g default-terminal "screen-256color"
set -g history-limit 10000
set -g mouse on
set -g base-index 1
set -g pane-base-index 1
bind r source-file ~/.tmux.conf \; display "Config reloaded"
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
set -g status-style bg=colour235,fg=colour250
set -g status-left  "#[fg=colour2]#H #[fg=colour8]| "
set -g status-right "#[fg=colour8]%H:%M %d-%b"
TMUX
    success "tmux config written"
fi

# ── 7. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║             Dev tools ready                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  node    $(node --version 2>/dev/null || echo 'reload shell: source ~/.nvm/nvm.sh')"
echo "  npm     $(npm --version 2>/dev/null || echo '-')"
echo "  python  $(python3 --version)"
echo "  git     $(git --version)"
echo "  tmux    $(tmux -V)"
echo "  nvim    $(nvim --version | head -1)"
echo ""
echo "  Start a persistent session:  tmux new -s camo"
echo "  Re-attach later:             tmux attach -t camo"
echo ""
success "All done. Log out and back in for zsh + nvm to take effect."
