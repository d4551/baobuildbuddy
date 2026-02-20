#!/usr/bin/env bash
# BaoBuildBuddy - Automated setup for macOS and Linux
# Usage: bash scripts/setup.sh [--skip-checks] [--skip-python]
set -euo pipefail

BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

SKIP_CHECKS=false
SKIP_PYTHON=false
ERRORS=0
WARNINGS=0

for arg in "$@"; do
  case "$arg" in
    --skip-checks) SKIP_CHECKS=true ;;
    --skip-python) SKIP_PYTHON=true ;;
    --help|-h)
      echo "Usage: bash scripts/setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-checks   Skip typecheck, lint, and test verification"
      echo "  --skip-python   Skip Python venv setup (Bun-only install)"
      echo "  --help, -h      Show this help message"
      exit 0
      ;;
  esac
done

step()    { echo -e "\n${BOLD}${CYAN}>>>${RESET} $1"; }
ok()      { echo -e "  ${GREEN}[OK]${RESET} $1"; }
warn()    { echo -e "  ${YELLOW}[WARN]${RESET} $1"; WARNINGS=$((WARNINGS + 1)); }
fail()    { echo -e "  ${RED}[FAIL]${RESET} $1"; ERRORS=$((ERRORS + 1)); }
die()     { echo -e "\n  ${RED}[FATAL]${RESET} $1"; exit 1; }

echo -e "${BOLD}"
cat << 'BANNER'
   ____              ____        _ _     _ ____            _     _
  | __ )  __ _  ___ | __ ) _   _(_) | __| | __ ) _   _  __| | __| |_   _
  |  _ \ / _` |/ _ \|  _ \| | | | | |/ _` |  _ \| | | |/ _` |/ _` | | | |
  | |_) | (_| | (_) | |_) | |_| | | | (_| | |_) | |_| | (_| | (_| | |_| |
  |____/ \__,_|\___/|____/ \__,_|_|_|\__,_|____/ \__,_|\__,_|\__,_|\__, |
                                                                     |___/
BANNER
echo -e "${RESET}"

OS="$(uname -s)"
ARCH="$(uname -m)"
echo -e "  ${DIM}Platform: ${OS} ${ARCH}${RESET}"
echo -e "  ${DIM}Script:   setup.sh v1.0${RESET}"
echo ""

# ── 1. Check prerequisites ───────────────────────────────────────────────────

step "Checking prerequisites..."

if command -v bun &>/dev/null; then
  BUN_VER="$(bun --version)"
  ok "Bun ${BUN_VER}"
else
  die "Bun is not installed. Install from https://bun.sh"
fi

if command -v git &>/dev/null; then
  ok "Git $(git --version | cut -d' ' -f3)"
else
  die "Git is not installed."
fi

if [ "$SKIP_PYTHON" = false ]; then
  if command -v python3 &>/dev/null; then
    PY_VER="$(python3 --version | cut -d' ' -f2)"
    PY_MAJOR="$(echo "$PY_VER" | cut -d. -f1)"
    PY_MINOR="$(echo "$PY_VER" | cut -d. -f2)"
    if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 10 ]; then
      ok "Python ${PY_VER}"
    else
      warn "Python ${PY_VER} found but 3.10+ required for RPA scripts"
    fi
  else
    warn "Python 3 not found -- RPA/scraper features will be unavailable"
  fi
fi

CHROME_FOUND=false
if command -v google-chrome &>/dev/null; then
  ok "Chrome found: $(command -v google-chrome)"
  CHROME_FOUND=true
elif command -v chromium &>/dev/null; then
  ok "Chromium found: $(command -v chromium)"
  CHROME_FOUND=true
elif command -v chromium-browser &>/dev/null; then
  ok "Chromium found: $(command -v chromium-browser)"
  CHROME_FOUND=true
elif [ "$OS" = "Darwin" ] && [ -d "/Applications/Google Chrome.app" ]; then
  ok "Chrome found: /Applications/Google Chrome.app"
  CHROME_FOUND=true
fi
if [ "$CHROME_FOUND" = false ]; then
  warn "Chrome/Chromium not detected -- RPA browser automation requires it"
fi

# ── 2. Install Bun dependencies ──────────────────────────────────────────────

step "Installing Bun dependencies..."
if bun install; then
  ok "bun install complete"
else
  die "bun install failed"
fi

# ── 3. Python virtual environment ─────────────────────────────────────────────

if [ "$SKIP_PYTHON" = false ] && command -v python3 &>/dev/null; then
  step "Setting up Python virtual environment..."

  if [ -d ".venv" ]; then
    ok "Virtual environment already exists at .venv/"
  else
    python3 -m venv .venv
    ok "Created .venv/"
  fi

  # shellcheck disable=SC1091
  source .venv/bin/activate
  python -m pip install --upgrade pip --quiet 2>/dev/null
  python -m pip install -r packages/scraper/requirements.txt --quiet 2>/dev/null
  ok "Python dependencies installed"

  # Verify rpa is importable
  if python -c "import rpa" 2>/dev/null; then
    ok "rpa module verified"
  else
    warn "rpa module could not be imported -- check packages/scraper/requirements.txt"
  fi
else
  if [ "$SKIP_PYTHON" = true ]; then
    echo -e "\n  ${DIM}Skipping Python setup (--skip-python)${RESET}"
  fi
fi

# ── 4. Environment file ──────────────────────────────────────────────────────

step "Checking environment configuration..."

if [ -f ".env" ]; then
  ok ".env exists"
else
  if [ -f ".env.example" ]; then
    cp .env.example .env
    ok "Created .env from .env.example"
    warn "Edit .env with your environment-specific values before running"
  else
    fail ".env.example not found -- cannot bootstrap environment"
  fi
fi

# ── 5. Database ───────────────────────────────────────────────────────────────

step "Setting up database..."

if bun run db:generate 2>&1; then
  ok "Schema generation complete"
else
  fail "db:generate failed"
fi

if bun run db:push 2>&1; then
  ok "Schema push complete"
else
  fail "db:push failed"
fi

# ── 6. Verification ──────────────────────────────────────────────────────────

if [ "$SKIP_CHECKS" = false ]; then
  step "Running verification checks..."

  if bun run typecheck 2>&1; then
    ok "Typecheck passed"
  else
    fail "Typecheck failed -- run 'bun run typecheck' for details"
  fi

  if bun run lint 2>&1; then
    ok "Lint passed (includes WCAG/token validation)"
  else
    fail "Lint failed -- run 'bun run lint' for details"
  fi

  if bun run test 2>&1; then
    ok "Tests passed"
  else
    fail "Tests failed -- run 'bun run test' for details"
  fi
else
  echo -e "\n  ${DIM}Skipping verification (--skip-checks)${RESET}"
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}────────────────────────────────────────${RESET}"

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}  Setup complete! No issues found.${RESET}"
elif [ "$ERRORS" -eq 0 ]; then
  echo -e "${BOLD}${YELLOW}  Setup complete with ${WARNINGS} warning(s).${RESET}"
else
  echo -e "${BOLD}${RED}  Setup finished with ${ERRORS} error(s) and ${WARNINGS} warning(s).${RESET}"
fi

echo -e "${BOLD}────────────────────────────────────────${RESET}"
echo ""
echo "  Next steps:"
echo "    1. Review .env and set your values (API keys, ports, etc.)"
echo "    2. Start the dev server:  bun run dev"
echo "    3. Open the UI URL shown as 'Local:' in the Nuxt output (usually http://localhost:3001)"
echo "    4. Open health check in browser: http://localhost:3000/api/health"
echo ""
echo -e "  ${DIM}\"It's dangerous to go alone! Take this.\"${RESET}"
echo ""
