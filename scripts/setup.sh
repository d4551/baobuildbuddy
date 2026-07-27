#!/usr/bin/env bash
# BaoBuildBuddy - Automated setup for macOS and Linux
# Usage: bash scripts/setup.sh [--skip-checks] [--skip-browser-install] [--include-build] [--include-desktop-build]
set -euo pipefail

BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

SKIP_CHECKS=false
SKIP_BROWSER_INSTALL=false
INCLUDE_BUILD=false
INCLUDE_DESKTOP_BUILD=false
ERRORS=0
WARNINGS=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRED_BUN_VERSION="$(bash "$REPO_ROOT/scripts/read-bun-version.sh")" || REQUIRED_BUN_VERSION="1.3.14"
REQUIRED_BUN_MAJOR="${REQUIRED_BUN_VERSION%%.*}"
REQUIRED_BUN_REST="${REQUIRED_BUN_VERSION#*.}"
REQUIRED_BUN_MINOR="${REQUIRED_BUN_REST%%.*}"

for arg in "$@"; do
  case "$arg" in
    --skip-checks) SKIP_CHECKS=true ;;
    --skip-browser-install) SKIP_BROWSER_INSTALL=true ;;
    --include-build) INCLUDE_BUILD=true ;;
    --include-desktop-build) INCLUDE_DESKTOP_BUILD=true ;;
    --help|-h)
      echo "Usage: bash scripts/setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-checks   Skip typecheck, lint, and test verification"
      echo "  --skip-browser-install Skip Playwright browser installation"
      echo "  --include-build Run bun run build after checks"
      echo "  --include-desktop-build Run bun run build:desktop after checks/build"
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

resolve_db_path() {
  local env_db_path
  local default_db_path="$HOME/.bao/bao.db"

  if [ -f ".env" ]; then
    env_db_path="$(awk -F= '/^DB_PATH=/{print $2; exit}' .env | tr -d '\r')"
    env_db_path="${env_db_path%%#*}"
    env_db_path="$(echo "$env_db_path" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  fi

  local resolved_path="${env_db_path:-$default_db_path}"
  if [ "${resolved_path:0:1}" = "~" ]; then
    resolved_path="${HOME}${resolved_path:1}"
  fi

  printf "%s" "$resolved_path"
}

run_db_push_with_recovery() {
  local db_push_output
  local db_path

  if db_push_output="$(bun run db:push 2>&1)"; then
    ok "Schema push complete"
    return 0
  fi

  db_path="$(resolve_db_path)"

  if [ ! -f "$db_path" ]; then
    fail "db:push failed"
    printf "%s\n" "$db_push_output"
    return 1
  fi

  if printf "%s" "$db_push_output" | grep -q "already exists"; then
    warn "Detected a pre-existing local database with conflicting indexes at $db_path"
    rm -f "$db_path" "${db_path}-shm" "${db_path}-wal"
    mkdir -p "$(dirname "$db_path")"
    if bun run db:push --force 2>&1; then
      ok "Schema push complete after local database reset"
      return 0
    fi
  fi

  fail "db:push failed"
  printf "%s\n" "$db_push_output"
  return 1
}

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
echo -e "  ${DIM}Script:   setup.sh${RESET}"
echo ""

# ── 1. Check prerequisites ───────────────────────────────────────────────────

step "Checking prerequisites..."

if command -v bun &>/dev/null; then
  BUN_VER="$(bun --version)"
  ok "Bun ${BUN_VER}"
else
  die "Bun is not installed. Install from https://bun.sh"
fi

if [ -z "$REQUIRED_BUN_VERSION" ]; then
  die "Unable to resolve required Bun version from package.json packageManager field."
fi

BUN_MAJOR="$(echo "$BUN_VER" | cut -d. -f1)"
BUN_MINOR="$(echo "$BUN_VER" | cut -d. -f2)"
if [ -z "$BUN_MAJOR" ] || [ -z "$BUN_MINOR" ]; then
  die "Unable to parse Bun version: ${BUN_VER}"
fi
if [ "$BUN_MAJOR" -ne "$REQUIRED_BUN_MAJOR" ] || [ "$BUN_MINOR" -ne "$REQUIRED_BUN_MINOR" ]; then
  die "Bun ${BUN_VER} detected. Workspace requires Bun ${REQUIRED_BUN_MAJOR}.${REQUIRED_BUN_MINOR}.x."
fi

if command -v git &>/dev/null; then
  ok "Git $(git --version | cut -d' ' -f3)"
else
  die "Git is not installed."
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
  warn "Chrome/Chromium not detected -- system Chrome is optional (Playwright bundles its own)"
fi

# ── 2. Install Bun dependencies ──────────────────────────────────────────────

step "Installing Bun dependencies..."
if bun install; then
  ok "bun install complete"
else
  die "bun install failed"
fi

step "Preparing Nuxt types..."
if (cd packages/client && bun --bun run nuxt prepare) 2>&1; then
  ok "Nuxt types generated"
else
  warn "Nuxt prepare failed -- client typecheck/lint may fail"
fi

step "Generating server type declarations..."
if bun run --cwd packages/server build:types 2>&1; then
  ok "Server type declarations generated"
else
  warn "Server build:types failed -- client lint may fail"
fi

# ── 3. Playwright browsers ────────────────────────────────────────────────────

if [ "$SKIP_BROWSER_INSTALL" = false ]; then
  step "Installing Playwright Chromium for Bun automation runtime..."
  if bun run automation:browsers:install 2>&1; then
    ok "Playwright Chromium installed"
  else
    fail "Playwright browser installation failed"
  fi
else
  echo -e "\n  ${DIM}Skipping Playwright browser installation (--skip-browser-install)${RESET}"
fi

# ── 4. Environment file ──────────────────────────────────────────────────────

step "Checking environment configuration..."

if [ -f ".env" ]; then
  ok ".env exists"
else
  if [ -f ".env.example" ]; then
    cp .env.example .env
    ok "Created .env from .env.example"
    # Remove NUXT_PUBLIC_I18N_SUPPORTED_LOCALES (runtime override breaks i18n plugin)
    temp_env="$(mktemp)"
    grep -v '^NUXT_PUBLIC_I18N_SUPPORTED_LOCALES=' .env > "$temp_env"
    mv "$temp_env" .env
    echo "AUTOMATION_STDIO_BUFFER_LIMIT=2000" >> .env
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

if run_db_push_with_recovery; then
  :
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

if [ "$INCLUDE_BUILD" = true ]; then
  step "Building applications..."
  if bun run build 2>&1; then
    ok "Build passed"
  else
    fail "Build failed -- run 'bun run build' for details"
  fi
else
  echo -e "\n  ${DIM}Skipping build (--include-build not set)${RESET}"
fi

if [ "$INCLUDE_DESKTOP_BUILD" = true ]; then
  step "Building desktop application (Tauri)..."
  if command -v rustc >/dev/null 2>&1 && command -v cargo >/dev/null 2>&1; then
    if LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bun run build:desktop 2>&1; then
      ok "Desktop build passed"
    else
      fail "Desktop build failed -- run 'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bun run build:desktop' for details"
    fi
  else
    fail "Desktop build requested but Rust toolchain is unavailable (rustc/cargo missing)"
  fi
else
  echo -e "\n  ${DIM}Skipping desktop build (--include-desktop-build not set)${RESET}"
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
