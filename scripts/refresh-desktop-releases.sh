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
LINUX_DOCKERFILE_DIR="$REPO_ROOT/scripts/docker/linux-arm64-builder"
APP_VERSION="$(awk -F '"' '/^version = /{print $2; exit}' "$REPO_ROOT/packages/desktop/src-tauri/Cargo.toml")"
APP_PRODUCT_NAME="$(awk -F '"' '/"productName"[[:space:]]*:/ {print $4; exit}' "$REPO_ROOT/packages/desktop/src-tauri/tauri.conf.json")"
APP_BINARY_NAME="$(awk -F '"' '/^name = /{print $2; exit}' "$REPO_ROOT/packages/desktop/src-tauri/Cargo.toml")"

LINUX_DOCKER_PLATFORM="linux/arm64/v8"
LINUX_DOCKER_IMAGE="baobuildbuddy-linux-arm64-builder:ubuntu24.04-v1"
LINUX_DOCKER_BUILD_ROOT="/tmp/bao-linux-build"
LINUX_DOCKER_BUN_CACHE_VOLUME="baobuildbuddy-linux-arm64-bun-cache"
LINUX_DOCKER_CARGO_GIT_VOLUME="baobuildbuddy-linux-arm64-cargo-git"
LINUX_DOCKER_CARGO_REGISTRY_VOLUME="baobuildbuddy-linux-arm64-cargo-registry"

MACOS_BUILD_TARGET="aarch64-apple-darwin"
MACOS_ARCH="aarch64"
WINDOWS_BUILD_TARGET="x86_64-pc-windows-msvc"
WINDOWS_ARCH_LABEL="x64"
LINUX_BUILD_TARGET="aarch64-unknown-linux-gnu"
LINUX_ARCH="aarch64"
LINUX_DEB_ARCH="arm64"
# Isolated target dir for Docker Linux build to avoid phf_macros rlib format errors
# from host (macOS) artifacts in the shared target/ directory
LINUX_CARGO_TARGET_DIR="packages/desktop/src-tauri/target-linux"
LINUX_TARGET_ROOT="$REPO_ROOT/${LINUX_CARGO_TARGET_DIR}/${LINUX_BUILD_TARGET}/release"

MACOS_HOST_BUNDLE_ROOT="$REPO_ROOT/packages/desktop/src-tauri/target/release/bundle"
MACOS_TARGET_BUNDLE_ROOT="$REPO_ROOT/packages/desktop/src-tauri/target/${MACOS_BUILD_TARGET}/release/bundle"
WINDOWS_TARGET_ROOT="$REPO_ROOT/packages/desktop/src-tauri/target/${WINDOWS_BUILD_TARGET}/release"

MACOS_APP_NAME="${APP_PRODUCT_NAME}"
MACOS_DMG_NAME="${APP_PRODUCT_NAME}_${APP_VERSION}_${MACOS_ARCH}.dmg"

cd "$REPO_ROOT"

if [ -z "$APP_VERSION" ]; then
  die "Could not resolve desktop app version from packages/desktop/src-tauri/Cargo.toml"
fi
if [ -z "$APP_PRODUCT_NAME" ]; then
  die "Could not resolve productName from packages/desktop/src-tauri/tauri.conf.json"
fi
if [ -z "$APP_BINARY_NAME" ]; then
  die "Could not resolve binary name from packages/desktop/src-tauri/Cargo.toml"
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  if ! command_exists "$1"; then
    die "Required command not found: $1"
  fi
}

prepare_linux_builder_image() {
  if [ ! -f "$LINUX_DOCKERFILE_DIR/Dockerfile" ]; then
    die "Linux ARM64 builder Dockerfile not found: $LINUX_DOCKERFILE_DIR/Dockerfile"
  fi

  step "Preparing Linux ARM64 builder image"
  docker build --platform "$LINUX_DOCKER_PLATFORM" -t "$LINUX_DOCKER_IMAGE" "$LINUX_DOCKERFILE_DIR" >/dev/null
  ok "Linux ARM64 builder image ready"
}

run_linux_container_build() {
  local container_command="$1"

  docker run --rm --platform "$LINUX_DOCKER_PLATFORM" \
    -v "$REPO_ROOT:/repo" \
    -v "$LINUX_DOCKER_BUN_CACHE_VOLUME:/root/.bun/install/cache" \
    -v "$LINUX_DOCKER_CARGO_GIT_VOLUME:/root/.cargo/git" \
    -v "$LINUX_DOCKER_CARGO_REGISTRY_VOLUME:/root/.cargo/registry" \
    -w /repo \
    -e LINUX_BUILD_TARGET="$LINUX_BUILD_TARGET" \
    -e LINUX_CARGO_TARGET_DIR="$LINUX_CARGO_TARGET_DIR" \
    -e LINUX_DOCKER_BUILD_ROOT="$LINUX_DOCKER_BUILD_ROOT" \
    -e APP_PRODUCT_NAME="$APP_PRODUCT_NAME" \
    -e LINUX_ARCH="$LINUX_ARCH" \
    -e HOME="/root" \
    "$LINUX_DOCKER_IMAGE" bash -lc "$container_command"
}

describe_linux_container_exit() {
  local exit_code="$1"

  case "$exit_code" in
    0)
      printf '%s\n' "success"
      ;;
    137)
      printf '%s\n' "exit 137 (container terminated, typically due to memory pressure)"
      ;;
    143)
      printf '%s\n' "exit 143 (container terminated by SIGTERM)"
      ;;
    *)
      printf 'exit %s\n' "$exit_code"
      ;;
  esac
}

latest_file_from_patterns() {
  local pattern
  local file
  local -a candidates=()

  shopt -s nullglob
  for pattern in "$@"; do
    for file in $pattern; do
      if [ -e "$file" ]; then
        candidates+=("$file")
      fi
    done
  done
  shopt -u nullglob

  if [ "${#candidates[@]}" -eq 0 ]; then
    return 1
  fi

  printf '%s\0' "${candidates[@]}" | xargs -0 ls -1dt | head -n 1
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

latest_file_or_die() {
  local description="$1"
  local file
  shift

  file="$(latest_file_from_patterns "$@")" || die "Could not resolve ${description}: $*"
  printf '%s\n' "$file"
}

run_headless_macos_dmg() {
  local app_bundle="$1"
  local dmg_output="$2"

  local dmg_script
  dmg_script="$(latest_file_or_die "headless macOS DMG script" \
    "$MACOS_HOST_BUNDLE_ROOT/dmg/bundle_dmg.sh" \
    "$MACOS_TARGET_BUNDLE_ROOT/dmg/bundle_dmg.sh" \
  )"

  if [ ! -f "$dmg_script" ]; then
    die "DMG helper script not found at $dmg_script"
  fi

  mkdir -p "$(dirname "$dmg_output")"
  rm -f "$dmg_output"

  "$dmg_script" --skip-jenkins "$dmg_output" "$app_bundle" || die "macOS headless DMG rebuild failed using script: $dmg_script"
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
  macos_expected_dmg="$MACOS_HOST_BUNDLE_ROOT/dmg/$MACOS_DMG_NAME"
  macos_build_reason="success"
  macos_build_exit=0
  set +e
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 CI=true bun run --filter '@bao/desktop' build -- \
    --target "$MACOS_BUILD_TARGET" \
    --bundles dmg \
    --config '{"build":{"beforeBuildCommand":""}}'
  macos_build_exit=$?
  set -e

  if [ "$macos_build_exit" -ne 0 ] || [ ! -f "$macos_expected_dmg" ]; then
    if [ "$macos_build_exit" -ne 0 ]; then
      macos_build_reason="non-zero exit code: $macos_build_exit"
    else
      macos_build_reason="missing expected artifact: $MACOS_DMG_NAME"
    fi
    warn "macOS bundling failed; reason: $macos_build_reason. Running headless fallback with --skip-jenkins."
    if [ "$macos_build_exit" -ne 0 ]; then
      warn "macOS bundling exited with code $macos_build_exit."
    else
      warn "macOS bundling exited successfully but expected artifact was not created: $MACOS_DMG_NAME"
    fi
    MACOS_APP_BUNDLE="$(latest_file_or_die "macOS application bundle" \
      "$MACOS_HOST_BUNDLE_ROOT/macos/$MACOS_APP_NAME.app" \
      "$MACOS_TARGET_BUNDLE_ROOT/macos/$MACOS_APP_NAME.app" \
    )"

    MACOS_DMG_PATH="$MACOS_HOST_BUNDLE_ROOT/dmg/$MACOS_DMG_NAME"
    run_headless_macos_dmg "$MACOS_APP_BUNDLE" "$MACOS_DMG_PATH"
    if [ -f "$MACOS_DMG_PATH" ]; then
      ok "macOS fallback DMG created: $MACOS_DMG_NAME"
    else
      die "macOS headless fallback failed to create: $MACOS_DMG_PATH"
    fi
  else
    ok "macOS build complete"
  fi
fi

if [ "$BUILD_WINDOWS" = true ]; then
  require_command cargo
  require_command docker

  if ! command_exists cargo-xwin; then
    step "Installing cargo-xwin"
    cargo install --locked cargo-xwin
    ok "cargo-xwin installed"
  fi

  WINDOWS_BUNDLE_DIR="$WINDOWS_TARGET_ROOT/bundle/nsis"
  WINDOWS_NSIS_WORKDIR="$WINDOWS_TARGET_ROOT/nsis/x64"
  WINDOWS_EXE_PATH="$WINDOWS_TARGET_ROOT/$APP_BINARY_NAME.exe"

  rm -rf "$WINDOWS_BUNDLE_DIR" "$WINDOWS_TARGET_ROOT/nsis"

  step "Building Windows x64 portable artifact"
  windows_build_exit=0
  set +e
  # Unset CI to avoid cargo-xwin --ci rejecting CI=1 (expects true/false)
  if [ -d "/opt/homebrew/opt/llvm/bin" ]; then
    PATH="/opt/homebrew/opt/llvm/bin:$PATH" env -u CI bun run --filter '@bao/desktop' build -- \
      --target "$WINDOWS_BUILD_TARGET" \
      --runner cargo-xwin \
      --config '{"build":{"beforeBuildCommand":""}}'
  else
    env -u CI bun run --filter '@bao/desktop' build -- \
      --target "$WINDOWS_BUILD_TARGET" \
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
  windows_setup_ok=false
  if command_exists makensis; then
    local_makensis_exit=0
    set +e
    (
      cd "$WINDOWS_NSIS_WORKDIR"
      makensis -V2 installer.nsi
    )
    local_makensis_exit=$?
    set -e
    if [ "$local_makensis_exit" -eq 0 ]; then
      windows_setup_ok=true
    else
      warn "Local makensis exited with code $local_makensis_exit; falling back to containerized NSIS."
      set +e
      docker run --rm --platform linux/arm64/v8 \
        -v "$REPO_ROOT:$REPO_ROOT" \
        -v "$HOME/Library/Caches/tauri:$HOME/Library/Caches/tauri" \
        -w "$WINDOWS_NSIS_WORKDIR" \
        ubuntu:24.04 bash -lc '
          set -euo pipefail
          export DEBIAN_FRONTEND=noninteractive
          apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 update
          apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 install -y --no-install-recommends nsis
          makensis -V2 installer.nsi
        '
      [ $? -eq 0 ] && windows_setup_ok=true
      set -e
    fi
  else
    set +e
    docker run --rm --platform linux/arm64/v8 \
      -v "$REPO_ROOT:$REPO_ROOT" \
      -v "$HOME/Library/Caches/tauri:$HOME/Library/Caches/tauri" \
      -w "$WINDOWS_NSIS_WORKDIR" \
      ubuntu:24.04 bash -lc '
        set -euo pipefail
        export DEBIAN_FRONTEND=noninteractive
        apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 update
        apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 install -y --no-install-recommends nsis
        makensis -V2 installer.nsi
      '
    [ $? -eq 0 ] && windows_setup_ok=true
    set -e
  fi

  if [ "$windows_setup_ok" = false ]; then
    die "NSIS setup build failed for requested Windows target."
  fi

  mkdir -p "$WINDOWS_BUNDLE_DIR"
  WINDOWS_SETUP_TARGET="$WINDOWS_BUNDLE_DIR/${APP_PRODUCT_NAME}_${APP_VERSION}_${WINDOWS_ARCH_LABEL}-setup.exe"
  WINDOWS_PORTABLE_TARGET="$WINDOWS_BUNDLE_DIR/${APP_PRODUCT_NAME}_${APP_VERSION}_${WINDOWS_ARCH_LABEL}-portable.exe"
  WINDOWS_SETUP_SOURCE=""
  if [ "$windows_setup_ok" = true ]; then
    WINDOWS_SETUP_SOURCE="$(latest_file_from_patterns \
      "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
      "$WINDOWS_TARGET_ROOT/nsis/x64/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
      "$WINDOWS_TARGET_ROOT/nsis/x64/nsis-output.exe")" || true
  fi
  if [ -n "$WINDOWS_SETUP_SOURCE" ] && [ -f "$WINDOWS_SETUP_SOURCE" ]; then
    cp "$WINDOWS_SETUP_SOURCE" "$WINDOWS_SETUP_TARGET"
    ok "Windows setup artifact staged"
  fi
  cp "$WINDOWS_EXE_PATH" "$WINDOWS_PORTABLE_TARGET"
  ok "Windows portable artifact staged"
fi

LINUX_ARTIFACTS_READY=false
if [ "$BUILD_LINUX" = true ]; then
  require_command docker
  prepare_linux_builder_image

  step "Building Linux ARM64 artifacts"
  linux_build_exit=0
  set +e
  run_linux_container_build '
    set -euo pipefail
    rm -rf "$LINUX_DOCKER_BUILD_ROOT"
    mkdir -p "$LINUX_DOCKER_BUILD_ROOT"
    tar \
      --exclude=.git \
      --exclude=node_modules \
      --exclude=packages/client/.nuxt \
      --exclude=packages/desktop/src-tauri/target \
      --exclude=packages/desktop/src-tauri/target-linux \
      -C /repo -cf - . | tar -C "$LINUX_DOCKER_BUILD_ROOT" -xf -
    cd "$LINUX_DOCKER_BUILD_ROOT"
    bun install --frozen-lockfile --filter "@bao/desktop"
    export CARGO_TARGET_DIR="$LINUX_DOCKER_BUILD_ROOT/$LINUX_CARGO_TARGET_DIR"
    export APPIMAGE_EXTRACT_AND_RUN=1
    export CARGO_BUILD_JOBS=1
    set +e
    bun run --filter "@bao/desktop" build -- \
      --target "$LINUX_BUILD_TARGET" \
      --config "{\"build\":{\"beforeBuildCommand\":\"\"}}"
    linux_build_exit=$?
    set -e
    mkdir -p "/repo/$LINUX_CARGO_TARGET_DIR/$LINUX_BUILD_TARGET"
    rm -rf "/repo/$LINUX_CARGO_TARGET_DIR/$LINUX_BUILD_TARGET/release"
    cp -R "$CARGO_TARGET_DIR/$LINUX_BUILD_TARGET/release" "/repo/$LINUX_CARGO_TARGET_DIR/$LINUX_BUILD_TARGET/"
    exit "$linux_build_exit"
  '
  linux_build_exit=$?
  set -e

  if [ "$linux_build_exit" -ne 0 ]; then
    warn "Linux ARM64 build returned $(describe_linux_container_exit "$linux_build_exit"); validating deb/rpm outputs and AppImage fallback."
  fi

  if ! latest_file_from_patterns \
    "$LINUX_TARGET_ROOT/bundle/deb/${APP_PRODUCT_NAME}_*_${LINUX_DEB_ARCH}.deb" \
    >/dev/null; then
    die "Linux deb artifact not found after requested build (build status: $(describe_linux_container_exit "$linux_build_exit"))."
  elif ! latest_file_from_patterns \
    "$LINUX_TARGET_ROOT/bundle/rpm/${APP_PRODUCT_NAME}-*.${LINUX_ARCH}.rpm" \
    >/dev/null; then
    die "Linux rpm artifact not found after requested build (build status: $(describe_linux_container_exit "$linux_build_exit"))."
  elif ! latest_file_from_patterns \
    "$LINUX_TARGET_ROOT/bundle/appimage/${APP_PRODUCT_NAME}_*_${LINUX_ARCH}.AppImage" \
    >/dev/null; then
    step "Running AppImage fallback build"
    run_linux_container_build '
        set -euo pipefail
        curl -L -o /tmp/appimagetool-aarch64.AppImage \
          https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-aarch64.AppImage
        chmod +x /tmp/appimagetool-aarch64.AppImage
        export APPIMAGE_EXTRACT_AND_RUN=1
        VERSION="$(awk -F "\"" "/^version = /{print \$2; exit}" packages/desktop/src-tauri/Cargo.toml)"
        LINUX_RELEASE_ROOT="/repo/$LINUX_CARGO_TARGET_DIR/${LINUX_BUILD_TARGET}/release"
        APPIMAGE_OUTPUT="${LINUX_RELEASE_ROOT}/bundle/appimage/${APP_PRODUCT_NAME}_${VERSION}_${LINUX_ARCH}.AppImage"
        /tmp/appimagetool-aarch64.AppImage \
          "${LINUX_RELEASE_ROOT}/bundle/appimage/${APP_PRODUCT_NAME}.AppDir" \
          "$APPIMAGE_OUTPUT"
    '
    ok "Linux AppImage fallback complete"
  fi

  if ! latest_file_from_patterns \
    "$LINUX_TARGET_ROOT/bundle/appimage/${APP_PRODUCT_NAME}_*_${LINUX_ARCH}.AppImage" \
    >/dev/null; then
    die "Linux AppImage artifact not found after fallback."
  else
    LINUX_ARTIFACTS_READY=true
  fi

  if [ "$LINUX_ARTIFACTS_READY" = true ]; then
    ok "Linux ARM64 artifacts ready"
  fi
fi

step "Refreshing canonical release directories"
mkdir -p "$RELEASE_ROOT/macos" "$RELEASE_ROOT/linux" "$RELEASE_ROOT/windows"

if [ "$BUILD_MACOS" = true ]; then
  rm -f "$RELEASE_ROOT/macos"/"${APP_PRODUCT_NAME}_"*.dmg
  copy_latest_artifact "$RELEASE_ROOT/macos" false \
    "$MACOS_HOST_BUNDLE_ROOT/dmg/${APP_PRODUCT_NAME}_*_${MACOS_ARCH}.dmg" \
    "$MACOS_TARGET_BUNDLE_ROOT/dmg/${APP_PRODUCT_NAME}_*_${MACOS_ARCH}.dmg"
fi

if [ "$BUILD_LINUX" = true ]; then
  rm -f "$RELEASE_ROOT/linux"/"${APP_PRODUCT_NAME}_"*.AppImage \
    "$RELEASE_ROOT/linux"/"${APP_PRODUCT_NAME}_"*.deb \
    "$RELEASE_ROOT/linux"/"${APP_PRODUCT_NAME}-"*.rpm
  copy_latest_artifact "$RELEASE_ROOT/linux" false \
    "$LINUX_TARGET_ROOT/bundle/appimage/${APP_PRODUCT_NAME}_*_${LINUX_ARCH}.AppImage"
  copy_latest_artifact "$RELEASE_ROOT/linux" false \
    "$LINUX_TARGET_ROOT/bundle/deb/${APP_PRODUCT_NAME}_*_${LINUX_DEB_ARCH}.deb"
  copy_latest_artifact "$RELEASE_ROOT/linux" false \
    "$LINUX_TARGET_ROOT/bundle/rpm/${APP_PRODUCT_NAME}-*.${LINUX_ARCH}.rpm"
fi

if [ "$BUILD_WINDOWS" = true ]; then
  rm -f "$RELEASE_ROOT/windows"/"${APP_PRODUCT_NAME}_"*.exe
  copy_latest_artifact "$RELEASE_ROOT/windows" true \
    "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-portable.exe" \
    "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}_portable.exe"
  if latest_file_from_patterns \
    "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
    "$WINDOWS_TARGET_ROOT/nsis/x64/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
    >/dev/null; then
    copy_latest_artifact "$RELEASE_ROOT/windows" false \
      "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
      "$WINDOWS_TARGET_ROOT/nsis/x64/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe"
  fi
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
