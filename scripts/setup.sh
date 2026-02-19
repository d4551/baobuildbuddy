#!/usr/bin/env bash
# BaoBuildBuddy - Setup script for macOS and Linux
# Usage: bash scripts/setup.sh
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

step() { echo -e "\n${BOLD}${CYAN}[SETUP]${RESET} $1"; }
ok()   { echo -e "  ${GREEN}OK${RESET} $1"; }
warn() { echo -e "  ${YELLOW}WARN${RESET} $1"; }
fail() { echo -e "  ${RED}FAIL${RESET} $1"; exit 1; }

echo -e "${BOLD}"
echo '  ____              ____        _ _     _ ____            _     _       '
echo ' | __ )  __ _  ___ | __ ) _   _(_) | __| | __ ) _   _  __| | __| |_   _'
echo ' |  _ \ / _` |/ _ \|  _ \| | | | | |/ _` |  _ \| | | |/ _` |/ _` | | | |'
echo ' | |_) | (_| | (_) | |_) | |_| | | | (_| | |_) | |_| | (_| | (_| | |_| |'
echo ' |____/ \__,_|\___/|____/ \__,_|_|_|\__,_|____/ \__,_|\__,_|\__,_|\__, |'
echo '                                                                    |___/'
echo -e "${RESET}"
echo "  Setup script for macOS / Linux"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────────

step "Checking prerequisites..."

if command -v bun &>/dev/null; then
  BUN_VER=$(bun --version)
  ok "Bun ${BUN_VER}"
else
  fail "Bun is not installed. Install from https://bun.sh"
fi

if command -v git &>/dev/null; then
  ok "Git $(git --version | cut -d' ' -f3)"
else
  fail "Git is not installed."
fi

if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version | cut -d' ' -f2)
  PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
  PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
  if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 10 ]; then
    ok "Python ${PY_VER}"
  else
    warn "Python ${PY_VER} detected but 3.10+ is required for RPA"
  fi
else
  warn "Python 3 not found. RPA features will not work."
fi

if command -v google-chrome &>/dev/null || command -v chromium &>/dev/null || command -v chromium-browser &>/dev/null; then
  ok "Chrome/Chromium found"
elif [ "$(uname)" = "Darwin" ] && [ -d "/Applications/Google Chrome.app" ]; then
  ok "Chrome found (macOS app)"
else
  warn "Chrome/Chromium not found. RPA browser automation requires it."
fi

# ── Install Bun dependencies ─────────────────────────────────────────────────

step "Installing Bun dependencies..."
bun install
ok "bun install complete"

# ── Python virtual environment ────────────────────────────────────────────────

step "Setting up Python virtual environment..."
if [ -d ".venv" ]; then
  ok "Virtual environment already exists at .venv/"
else
  python3 -m venv .venv
  ok "Created .venv/"
fi

source .venv/bin/activate
python -m pip install --upgrade pip --quiet
python -m pip install -r packages/scraper/requirements.txt --quiet
ok "Python dependencies installed"

# ── Environment file ──────────────────────────────────────────────────────────

step "Checking .env file..."
if [ -f ".env" ]; then
  ok ".env already exists"
else
  cp .env.example .env
  ok "Created .env from .env.example -- edit it with your values"
fi

# ── Database setup ────────────────────────────────────────────────────────────

step "Setting up database..."
bun run db:generate
bun run db:push
ok "Database schema pushed"

# ── Typecheck and lint ────────────────────────────────────────────────────────

step "Running typecheck..."
if bun run typecheck; then
  ok "Typecheck passed"
else
  warn "Typecheck had issues -- check output above"
fi

step "Running lint..."
if bun run lint; then
  ok "Lint passed"
else
  warn "Lint had issues -- check output above"
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${GREEN}Setup complete!${RESET}"
echo ""
echo "  Next steps:"
echo "    1. Edit .env with your environment-specific values"
echo "    2. Run: bun run dev"
echo "    3. Open http://localhost:3001 in your browser"
echo ""
echo '  "It'"'"'s dangerous to go alone! Take this."'
echo ""
