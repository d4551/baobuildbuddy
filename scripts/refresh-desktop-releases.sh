#!/usr/bin/env bash
# BaoBuildBuddy - Refresh desktop release artifacts for all OS targets
# Usage: bash scripts/refresh-desktop-releases.sh [--skip-quality-gates] [--skip-macos] [--skip-linux] [--skip-windows]
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
RESET="\033[0m"

RUN_QUALITY_GATES=true
BUILD_MACOS=true
BUILD_LINUX=true
BUILD_WINDOWS=true

step() { echo -e "\n${BOLD}${CYAN}>>>${RESET} $1"; }
ok() { echo -e "  ${GREEN}[OK]${RESET} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${RESET} $1"; }
die() { echo -e "  ${RED}[FAIL]${RESET} $1"; exit 1; }

usage() {
  cat <<'USAGE'
Usage: bash scripts/refresh-desktop-releases.sh [OPTIONS]

Options:
  --skip-quality-gates   Skip lint/typecheck/test/build before artifact builds
  --skip-macos           Skip macOS DMG build + staging
  --skip-linux           Skip Linux ARM64 build + staging
  --skip-windows         Skip Windows x64 build + staging
  --help, -h             Show this help message
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --skip-quality-gates) RUN_QUALITY_GATES=false ;;
    --skip-macos) BUILD_MACOS=false ;;
    --skip-linux) BUILD_LINUX=false ;;
    --skip-windows) BUILD_WINDOWS=false ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $arg"
      ;;
  esac
done

if [ "$BUILD_MACOS" = false ] && [ "$BUILD_LINUX" = false ] && [ "$BUILD_WINDOWS" = false ]; then
  die "At least one target must be enabled. Remove one of the --skip-* flags."
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RELEASE_ROOT="$REPO_ROOT/packages/desktop/releases"
APP_VERSION="$(awk -F '"' '/^version = /{print $2; exit}' "$REPO_ROOT/packages/desktop/src-tauri/Cargo.toml")"

cd "$REPO_ROOT"

if [ -z "$APP_VERSION" ]; then
  die "Could not resolve desktop app version from packages/desktop/src-tauri/Cargo.toml"
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  if ! command_exists "$1"; then
    die "Required command not found: $1"
  fi
}

latest_file_from_patterns() {
  local pattern
  local file
  local -a candidates=()

  shopt -s nullglob
  for pattern in "$@"; do
    for file in $pattern; do
      candidates+=("$file")
    done
  done
  shopt -u nullglob

  if [ "${#candidates[@]}" -eq 0 ]; then
    return 1
  fi

  ls -1t "${candidates[@]}" 2>/dev/null | head -n 1
}

copy_latest_artifact() {
  local destination_dir="$1"
  local normalize_windows_portable="$2"
  shift 2
  local source_file
  local destination_name

  source_file="$(latest_file_from_patterns "$@")" || die "Could not locate artifact for destination: $destination_dir"
  destination_name="$(basename "$source_file")"

  if [ "$normalize_windows_portable" = "true" ]; then
    destination_name="${destination_name/_x64_portable.exe/_x64-portable.exe}"
  fi

  cp "$source_file" "$destination_dir/$destination_name"
  ok "Staged $(basename "$destination_dir")/$destination_name"
}

sha256_for_file() {
  local file_path="$1"
  if command_exists sha256sum; then
    sha256sum "$file_path" | awk '{print $1}'
    return
  fi

  if command_exists shasum; then
    shasum -a 256 "$file_path" | awk '{print $1}'
    return
  fi

  die "No SHA-256 tool found (requires sha256sum or shasum)."
}

if [ "$RUN_QUALITY_GATES" = true ]; then
  step "Running release quality gates"
  bun run lint
  bun run typecheck
  bun run test
  bun run build
  ok "Quality gates passed"
else
  warn "Skipping quality gates (--skip-quality-gates)"
fi

if [ "$BUILD_MACOS" = true ]; then
  if [ "$(uname -s)" != "Darwin" ]; then
    die "macOS artifact build requires a macOS host."
  fi

  require_command rustc
  require_command cargo

  step "Building macOS DMG artifact"
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 CI=true bun run --filter '@bao/desktop' build -- \
    --target aarch64-apple-darwin \
    --bundles dmg \
    --config '{"build":{"beforeBuildCommand":""}}'
  ok "macOS build complete"
fi

if [ "$BUILD_WINDOWS" = true ]; then
  require_command cargo
  require_command docker

  if ! command_exists cargo-xwin; then
    step "Installing cargo-xwin"
    cargo install --locked cargo-xwin
    ok "cargo-xwin installed"
  fi

  WINDOWS_TARGET_ROOT="$REPO_ROOT/packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release"
  WINDOWS_BUNDLE_DIR="$WINDOWS_TARGET_ROOT/bundle/nsis"
  WINDOWS_NSIS_WORKDIR="$WINDOWS_TARGET_ROOT/nsis/x64"
  WINDOWS_EXE_PATH="$WINDOWS_TARGET_ROOT/bao-build-buddy-desktop.exe"

  rm -rf "$WINDOWS_BUNDLE_DIR" "$WINDOWS_TARGET_ROOT/nsis"

  step "Building Windows x64 portable artifact"
  windows_build_exit=0
  set +e
  if [ -d "/opt/homebrew/opt/llvm/bin" ]; then
    PATH="/opt/homebrew/opt/llvm/bin:$PATH" bun run --filter '@bao/desktop' build -- \
      --target x86_64-pc-windows-msvc \
      --runner cargo-xwin \
      --config '{"build":{"beforeBuildCommand":""}}'
  else
    bun run --filter '@bao/desktop' build -- \
      --target x86_64-pc-windows-msvc \
      --runner cargo-xwin \
      --config '{"build":{"beforeBuildCommand":""}}'
  fi
  windows_build_exit=$?
  set -e

  if [ "$windows_build_exit" -ne 0 ]; then
    warn "Windows cross-target build exited with code $windows_build_exit; validating emitted payloads before continuing."
  fi

  if [ ! -f "$WINDOWS_EXE_PATH" ]; then
    die "Windows executable not found: $WINDOWS_EXE_PATH"
  fi
  if [ ! -d "$WINDOWS_NSIS_WORKDIR" ]; then
    die "NSIS directory not found: $WINDOWS_NSIS_WORKDIR"
  fi
  if [ ! -f "$WINDOWS_NSIS_WORKDIR/installer.nsi" ]; then
    die "NSIS installer script not found: $WINDOWS_NSIS_WORKDIR/installer.nsi"
  fi
  ok "Windows payload generation complete"

  step "Building Windows x64 setup artifact"
  docker run --rm --platform linux/arm64/v8 \
    -v "$REPO_ROOT:$REPO_ROOT" \
    -v "$HOME/Library/Caches/tauri:$HOME/Library/Caches/tauri" \
    -w "$WINDOWS_NSIS_WORKDIR" \
    ubuntu:24.04 bash -lc '
      set -euo pipefail
      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install -y nsis
      makensis -V2 installer.nsi
    '

  WINDOWS_SETUP_SOURCE="$(latest_file_from_patterns \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/BaoBuildBuddy_*_x64-setup.exe" \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/nsis/x64/BaoBuildBuddy_*_x64-setup.exe" \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/nsis/x64/nsis-output.exe")" || die "Windows setup artifact not found after NSIS build."

  mkdir -p "$WINDOWS_BUNDLE_DIR"
  WINDOWS_SETUP_TARGET="$WINDOWS_BUNDLE_DIR/BaoBuildBuddy_${APP_VERSION}_x64-setup.exe"
  WINDOWS_PORTABLE_TARGET="$WINDOWS_BUNDLE_DIR/BaoBuildBuddy_${APP_VERSION}_x64-portable.exe"
  if [ "$WINDOWS_SETUP_SOURCE" != "$WINDOWS_SETUP_TARGET" ]; then
    cp "$WINDOWS_SETUP_SOURCE" "$WINDOWS_SETUP_TARGET"
  fi
  cp "$WINDOWS_EXE_PATH" "$WINDOWS_PORTABLE_TARGET"
  ok "Windows setup and portable artifacts prepared"
fi

if [ "$BUILD_LINUX" = true ]; then
  require_command docker

  step "Building Linux ARM64 artifacts"
  linux_build_exit=0
  set +e
  docker run --rm --platform linux/arm64/v8 \
    -v "$REPO_ROOT:/workspace" \
    -w /workspace \
    ubuntu:24.04 bash -lc '
      set -euo pipefail
      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install -y curl unzip build-essential pkg-config \
        libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
        librsvg2-dev patchelf ca-certificates git
      curl -fsSL https://bun.sh/install | bash
      export BUN_INSTALL="/root/.bun"
      export PATH="$BUN_INSTALL/bin:$PATH"
      curl https://sh.rustup.rs -sSf | sh -s -- -y
      export PATH="/root/.cargo/bin:$PATH"
      rustup target add aarch64-unknown-linux-gnu
      export APPIMAGE_EXTRACT_AND_RUN=1
      bun run --filter "@bao/desktop" build -- \
        --target aarch64-unknown-linux-gnu \
        --config "{\"build\":{\"beforeBuildCommand\":\"\"}}"
    '
  linux_build_exit=$?
  set -e

  if [ "$linux_build_exit" -ne 0 ]; then
    warn "Linux ARM64 build exited with code $linux_build_exit; validating emitted payloads and AppImage fallback."
  fi

  if ! latest_file_from_patterns \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/deb/BaoBuildBuddy_*_arm64.deb" \
    >/dev/null; then
    die "Linux deb artifact not found after Linux build."
  fi

  if ! latest_file_from_patterns \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/rpm/BaoBuildBuddy-*.aarch64.rpm" \
    >/dev/null; then
    die "Linux rpm artifact not found after Linux build."
  fi

  if ! latest_file_from_patterns \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy_*_aarch64.AppImage" \
    >/dev/null; then
    step "Running AppImage fallback build"
    docker run --rm --platform linux/arm64/v8 \
      -v "$REPO_ROOT:/workspace" \
      -w /workspace \
      ubuntu:24.04 bash -lc '
        set -euo pipefail
        export DEBIAN_FRONTEND=noninteractive
        apt-get update
        apt-get install -y curl ca-certificates libglib2.0-0 file squashfs-tools
        curl -L -o /tmp/appimagetool-aarch64.AppImage \
          https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-aarch64.AppImage
        chmod +x /tmp/appimagetool-aarch64.AppImage
        export APPIMAGE_EXTRACT_AND_RUN=1
        VERSION="$(awk -F "\"" "/^version = /{print \$2; exit}" packages/desktop/src-tauri/Cargo.toml)"
        APPIMAGE_OUTPUT="packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy_${VERSION}_aarch64.AppImage"
        /tmp/appimagetool-aarch64.AppImage \
          packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy.AppDir \
          "$APPIMAGE_OUTPUT"
      '
    ok "Linux AppImage fallback complete"
  fi

  if ! latest_file_from_patterns \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy_*_aarch64.AppImage" \
    >/dev/null; then
    die "Linux AppImage artifact not found after fallback."
  fi

  ok "Linux ARM64 artifacts ready"
fi

step "Refreshing canonical release directories"
mkdir -p "$RELEASE_ROOT/macos" "$RELEASE_ROOT/linux" "$RELEASE_ROOT/windows"

rm -f "$RELEASE_ROOT/macos"/BaoBuildBuddy_*.dmg
rm -f "$RELEASE_ROOT/linux"/BaoBuildBuddy_*.AppImage "$RELEASE_ROOT/linux"/BaoBuildBuddy_*.deb "$RELEASE_ROOT/linux"/BaoBuildBuddy-*.rpm
rm -f "$RELEASE_ROOT/windows"/BaoBuildBuddy_*.exe

if [ "$BUILD_MACOS" = true ]; then
  copy_latest_artifact "$RELEASE_ROOT/macos" false \
    "packages/desktop/src-tauri/target/release/bundle/dmg/BaoBuildBuddy_*_aarch64.dmg" \
    "packages/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/BaoBuildBuddy_*_aarch64.dmg"
fi

if [ "$BUILD_LINUX" = true ]; then
  copy_latest_artifact "$RELEASE_ROOT/linux" false \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy_*_aarch64.AppImage"
  copy_latest_artifact "$RELEASE_ROOT/linux" false \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/deb/BaoBuildBuddy_*_arm64.deb"
  copy_latest_artifact "$RELEASE_ROOT/linux" false \
    "packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/rpm/BaoBuildBuddy-*.aarch64.rpm"
fi

if [ "$BUILD_WINDOWS" = true ]; then
  copy_latest_artifact "$RELEASE_ROOT/windows" true \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/BaoBuildBuddy_*_x64-portable.exe" \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/BaoBuildBuddy_*_x64_portable.exe"
  copy_latest_artifact "$RELEASE_ROOT/windows" false \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/BaoBuildBuddy_*_x64-setup.exe" \
    "packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/nsis/x64/BaoBuildBuddy_*_x64-setup.exe"
fi

step "Regenerating release checksums"
cd "$RELEASE_ROOT"
artifacts=()
shopt -s nullglob
for artifact in macos/*.dmg linux/*.AppImage linux/*.deb linux/*.rpm windows/*.exe; do
  artifacts+=("$artifact")
done
shopt -u nullglob

if [ "${#artifacts[@]}" -eq 0 ]; then
  die "No staged artifacts found in packages/desktop/releases."
fi

: > sha256.txt
while IFS= read -r artifact; do
  printf '%s  %s\n' "$(sha256_for_file "$artifact")" "$artifact" >> sha256.txt
done < <(printf '%s\n' "${artifacts[@]}" | LC_ALL=C sort)

ok "Updated $RELEASE_ROOT/sha256.txt"

step "Release artifact summary"
ls -lh "$RELEASE_ROOT/macos" "$RELEASE_ROOT/linux" "$RELEASE_ROOT/windows"
ok "Desktop release refresh complete"
