#!/usr/bin/env bash
# mkdirs.sh — scaffold the standard project folder structure on camodevops
# Run once as camo67. Safe to re-run (mkdir -p never overwrites).

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      camodevops — Project Folder Setup       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Repos ─────────────────────────────────────────────────────────────────────
mkdir -p "$HOME/camodevops"         # this repo (already cloned by server-setup.sh)
mkdir -p "$HOME/agentic-harness"    # AI backend (clone separately)

# ── Shared (Samba share root) ─────────────────────────────────────────────────
mkdir -p "$HOME/shared/docs"        # shared documents
mkdir -p "$HOME/shared/assets"      # brand assets, images, etc.
mkdir -p "$HOME/shared/vault"       # credentials templates (never commit secrets)

# ── Projects ──────────────────────────────────────────────────────────────────
mkdir -p "$HOME/projects/camoflow"  # CamoFlow production app
mkdir -p "$HOME/projects/studio"    # Studio OS / client work
mkdir -p "$HOME/projects/scratch"   # throwaway experiments

# ── Backups ───────────────────────────────────────────────────────────────────
mkdir -p "$HOME/backups/harness"    # harness memory snapshots
mkdir -p "$HOME/backups/db"         # database dumps

# ── Logs ──────────────────────────────────────────────────────────────────────
mkdir -p "$HOME/logs"

# ── Print tree ────────────────────────────────────────────────────────────────
echo "  $HOME/"
echo "  ├── camodevops/          ← web + docker stack (this repo)"
echo "  ├── agentic-harness/     ← AI backend (clone separately)"
echo "  ├── projects/"
echo "  │   ├── camoflow/"
echo "  │   ├── studio/"
echo "  │   └── scratch/"
echo "  ├── shared/              ← Samba share root"
echo "  │   ├── docs/"
echo "  │   ├── assets/"
echo "  │   └── vault/           ← templates only, no secrets"
echo "  ├── backups/"
echo "  │   ├── harness/"
echo "  │   └── db/"
echo "  └── logs/"
echo ""
success "Folder structure created."
