#!/usr/bin/env bash
# devtools-setup.sh — dev tooling on the camodevops server.
# Installs: nvm + Node LTS, Claude Code CLI, nvim, tmux (+config), zsh, git global config.
# Idempotent. Requires: internet + (now available) NOPASSWD sudo on this box.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "== system packages =="
sudo apt-get update -qq
sudo apt-get install -y curl git zsh tmux neovim unzip build-essential

echo "== git global config (edit identity if needed) =="
git config --global user.name  "${GIT_NAME:-camo}"      || true
git config --global user.email "${GIT_EMAIL:-camo@camodevops.local}" || true
git config --global init.defaultBranch main

echo "== nvm + Node LTS =="
if [ ! -d "$HOME/.nvm" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm alias default 'lts/*'

echo "== Node + npm =="
node -v; npm -v

echo "== Claude Code CLI =="
if ! command -v claude >/dev/null 2>&1; then
  npm install -g @anthropic-ai/claude-code
fi
claude --version || echo "(claude installed; run 'claude' to authenticate)"

echo "== tmux config =="
cat > "$HOME/.tmux.conf" <<'EOF'
set -g mouse on
set -g history-limit 5000
bind r source-file ~/.tmux.conf \; display "tmux conf reloaded"
EOF

echo "== neovim minimal config =="
mkdir -p "$HOME/.config/nvim"
cat > "$HOME/.config/nvim/init.lua" <<'EOF'
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"
EOF

echo "DONE devtools-setup.sh"
