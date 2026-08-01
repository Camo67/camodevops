#!/usr/bin/env bash
# mkdirs.sh — create the camodevops operational folder tree.
# Idempotent: safe to re-run. Run on the camodevops server.
set -euo pipefail

BASE="${CAMODEVOPS_HOME:-$HOME/camodevops}"

echo "Creating camodevops tree at: $BASE"
mkdir -p \
  "$BASE/shared/docs/assets/vault" \
  "$BASE/projects" \
  "$BASE/backups" \
  "$BASE/logs" \
  "$BASE/scripts"

# CamOdevOps business + clients tree (matches earlier request)
mkdir -p \
  "$BASE/CamOdevOps/business/finance" \
  "$BASE/CamOdevOps/business/contracts" \
  "$BASE/CamOdevOps/business/admin" \
  "$BASE/CamOdevOps/business/marketing" \
  "$BASE/CamOdevOps/business/operations" \
  "$BASE/CamOdevOps/clients"

# Keep dirs git-tracked even when empty
find "$BASE" -type d -empty -exec touch '{}/.gitkeep' \;

echo "Done. Tree:"
find "$BASE" -maxdepth 3 -type d | sort
