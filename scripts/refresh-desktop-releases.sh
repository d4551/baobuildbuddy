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
DESKTOP_PACKAGE_ROOT="$REPO_ROOT/packages/desktop"
LINUX_DOCKERFILE_DIR="$REPO_ROOT/scripts/docker/linux-arm64-builder"
APP_VERSION="$(cd "$REPO_ROOT" && bun --eval 'const pkg = await Bun.file("packages/desktop/package.json").json(); process.stdout.write(String(pkg.version ?? ""));')"
APP_PRODUCT_NAME="$(cd "$REPO_ROOT" && bun --eval 'const config = await Bun.file("packages/desktop/src-tauri/tauri.conf.json").json(); process.stdout.write(String(config.productName ?? ""));')"
APP_BINARY_NAME="$(awk -F '"' '/^name = /{print $2; exit}' "$REPO_ROOT/packages/desktop/src-tauri/Cargo.toml")"
TAURI_CLI_VERSION="$(cd "$REPO_ROOT" && bun --eval 'const pkg = await Bun.file("packages/desktop/package.json").json(); const version = String(pkg.devDependencies?.["@tauri-apps/cli"] ?? "").replace(/^[^0-9]*/, ""); process.stdout.write(version);')"
WINDOWS_WEBVIEW_BOOTSTRAPPER_RELATIVE_PATH="$(cd "$REPO_ROOT" && bun --eval 'const constants = await import("./packages/shared/src/constants/scripts.ts"); process.stdout.write(`${constants.DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH}.exe`);')"
WINDOWS_WEBVIEW_BOOTSTRAPPER_DISPLAY_PATH="$(printf '%s' "gen/runtime/${WINDOWS_WEBVIEW_BOOTSTRAPPER_RELATIVE_PATH}" | sed 's#/#\\\\#g')"

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

MACOS_DMG_NAME="${APP_PRODUCT_NAME}_${APP_VERSION}_${MACOS_ARCH}.dmg"
VERIFY_TARGETS=()

cd "$REPO_ROOT"

if [ -z "$APP_VERSION" ]; then
  die "Could not resolve desktop app version from packages/desktop/package.json"
fi
if [ -z "$APP_PRODUCT_NAME" ]; then
  die "Could not resolve productName from packages/desktop/src-tauri/tauri.conf.json"
fi
if [ -z "$APP_BINARY_NAME" ]; then
  die "Could not resolve binary name from packages/desktop/src-tauri/Cargo.toml"
fi
if [ -z "$TAURI_CLI_VERSION" ]; then
  die "Could not resolve @tauri-apps/cli version from packages/desktop/package.json"
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  if ! command_exists "$1"; then
    die "Required command not found: $1"
  fi
}

resolve_installed_tauri_cli_version() {
  if ! cargo tauri --version >/dev/null 2>&1; then
    return 1
  fi

  cargo tauri --version | awk '{print $NF}'
}

ensure_tauri_cli() {
  local installed_version=""

  if installed_version="$(resolve_installed_tauri_cli_version)"; then
    if [ "$installed_version" = "$TAURI_CLI_VERSION" ]; then
      return
    fi

    step "Updating tauri-cli to $TAURI_CLI_VERSION"
  else
    step "Installing tauri-cli $TAURI_CLI_VERSION"
  fi

  cargo install tauri-cli --version "$TAURI_CLI_VERSION" --locked
  ok "tauri-cli $TAURI_CLI_VERSION ready"
}

run_desktop_hook() {
  local hook_name="$1"
  shift
  bun "$REPO_ROOT/scripts/cleanup-desktop-build.ts" "$hook_name" "$@"
}

run_host_tauri_build() {
  local -a tauri_args=("$@")

  (
    cd "$DESKTOP_PACKAGE_ROOT"
    cargo tauri build "${tauri_args[@]}"
  )
}

resolve_tauri_cache_dir() {
  if [ -n "${TAURI_CACHE_DIR:-}" ]; then
    printf '%s\n' "$TAURI_CACHE_DIR"
    return
  fi

  case "$(uname -s)" in
    Darwin)
      printf '%s\n' "$HOME/Library/Caches/tauri"
      ;;
    CYGWIN*|MINGW*|MSYS*|Windows_NT)
      if [ -n "${LOCALAPPDATA:-}" ]; then
        printf '%s\n' "$LOCALAPPDATA/tauri"
      else
        printf '%s\n' "$HOME/AppData/Local/tauri"
      fi
      ;;
    *)
      if [ -n "${XDG_CACHE_HOME:-}" ]; then
        printf '%s\n' "$XDG_CACHE_HOME/tauri"
      else
        printf '%s\n' "$HOME/.cache/tauri"
      fi
      ;;
  esac
}

is_windows_host() {
  case "$(uname -s)" in
    CYGWIN*|MINGW*|MSYS*|Windows_NT)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

run_containerized_windows_nsis() {
  local tauri_cache_root
  tauri_cache_root="$(resolve_tauri_cache_dir)"
  mkdir -p "$tauri_cache_root"

  docker run --rm --platform linux/arm64/v8 \
    -v "$REPO_ROOT:$REPO_ROOT" \
    -v "$tauri_cache_root:$tauri_cache_root" \
    -w "$WINDOWS_NSIS_WORKDIR" \
    ubuntu:24.04 bash -lc '
      set -euo pipefail
      export DEBIAN_FRONTEND=noninteractive
      apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 update
      apt-get -o Acquire::ForceIPv4=true -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 install -y --no-install-recommends nsis
      sed -E "s/^([[:space:]]*)File \\/a /\\1File /" installer.nsi > installer.cross-host.nsi
      makensis -V2 installer.cross-host.nsi
    '
}

prepare_linux_builder_image() {
  if [ ! -f "$LINUX_DOCKERFILE_DIR/Dockerfile" ]; then
    die "Linux ARM64 builder Dockerfile not found: $LINUX_DOCKERFILE_DIR/Dockerfile"
  fi

  step "Preparing Linux ARM64 builder image"
  docker build \
    --platform "$LINUX_DOCKER_PLATFORM" \
    --build-arg "TAURI_CLI_VERSION=$TAURI_CLI_VERSION" \
    -t "$LINUX_DOCKER_IMAGE" \
    "$LINUX_DOCKERFILE_DIR" \
    >/dev/null
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
    -e APP_BINARY_NAME="$APP_BINARY_NAME" \
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
  shift
  local source_file
  local destination_name

  source_file="$(latest_file_from_patterns "$@")" || die "Could not locate artifact for destination: $destination_dir"
  destination_name="$(basename "$source_file")"

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

create_zip_archive() {
  local source_dir="$1"
  local output_path="$2"
  local parent_dir
  local base_name

  parent_dir="$(dirname "$source_dir")"
  base_name="$(basename "$source_dir")"
  rm -f "$output_path"

  if command_exists zip; then
    (
      cd "$parent_dir"
      zip -qr -9 "$output_path" "$base_name"
    )
    return
  fi

  if command_exists ditto; then
    ditto -c -k --keepParent "$source_dir" "$output_path"
    return
  fi

  if command_exists powershell; then
    powershell -NoProfile -Command "Compress-Archive -Path '$source_dir' -DestinationPath '$output_path' -Force" >/dev/null
    return
  fi

  if command_exists pwsh; then
    pwsh -NoProfile -Command "Compress-Archive -Path '$source_dir' -DestinationPath '$output_path' -Force" >/dev/null
    return
  fi

  die "Unable to create zip archive for $source_dir (requires zip, ditto, powershell, or pwsh)."
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
  VERIFY_TARGETS+=("macos")
  if [ "$(uname -s)" != "Darwin" ]; then
    die "macOS artifact build requires a macOS host."
  fi

  require_command rustc
  require_command cargo
  ensure_tauri_cli

  step "Building macOS DMG artifact"
  macos_expected_dmg="$MACOS_HOST_BUNDLE_ROOT/dmg/$MACOS_DMG_NAME"
  macos_build_exit=0
  run_desktop_hook prebuild
  set +e
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 CI=true run_host_tauri_build \
    --target "$MACOS_BUILD_TARGET" \
    --bundles dmg
  macos_build_exit=$?
  set -e

  if [ "$macos_build_exit" -eq 0 ] && [ -f "$macos_expected_dmg" ]; then
    ok "macOS build complete"
  else
    if [ "$macos_build_exit" -ne 0 ]; then
      warn "macOS DMG bundling exited with code $macos_build_exit; attempting deterministic fallback."
    else
      warn "macOS DMG bundling completed without the expected artifact; attempting deterministic fallback."
    fi

    set +e
    run_desktop_hook postbuild --target "$MACOS_BUILD_TARGET" --bundles dmg
    macos_fallback_exit=$?
    set -e

    if [ "$macos_fallback_exit" -ne 0 ] || [ ! -f "$macos_expected_dmg" ]; then
      warn "macOS DMG fallback requires an application bundle. Rebuilding the application bundle for fallback."
      run_desktop_hook prebuild
      LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 CI=true run_host_tauri_build \
        --target "$MACOS_BUILD_TARGET" \
        --bundles app
      run_desktop_hook postbuild --target "$MACOS_BUILD_TARGET" --bundles dmg
    fi

    if [ -f "$macos_expected_dmg" ]; then
      ok "macOS fallback DMG created: $MACOS_DMG_NAME"
    else
      die "macOS headless fallback failed to create: $macos_expected_dmg"
    fi
  fi
fi

if [ "$BUILD_WINDOWS" = true ]; then
  VERIFY_TARGETS+=("windows")
  require_command cargo
  require_command docker
  ensure_tauri_cli

  if ! command_exists cargo-xwin; then
    step "Installing cargo-xwin"
    cargo install --locked cargo-xwin
    ok "cargo-xwin installed"
  fi

  WINDOWS_BUNDLE_DIR="$WINDOWS_TARGET_ROOT/bundle/nsis"
  WINDOWS_PORTABLE_DIR="$WINDOWS_TARGET_ROOT/bundle/portable"
  WINDOWS_NSIS_WORKDIR="$WINDOWS_TARGET_ROOT/nsis/x64"
  WINDOWS_EXE_PATH="$WINDOWS_TARGET_ROOT/$APP_BINARY_NAME.exe"
  WINDOWS_PORTABLE_STAGE_DIR="$WINDOWS_PORTABLE_DIR/${APP_PRODUCT_NAME}_${APP_VERSION}_${WINDOWS_ARCH_LABEL}-portable"
  WINDOWS_PORTABLE_ZIP_PATH="$WINDOWS_PORTABLE_DIR/${APP_PRODUCT_NAME}_${APP_VERSION}_${WINDOWS_ARCH_LABEL}-portable.zip"
  WINDOWS_PORTABLE_BOOTSTRAPPER_PATH="$WINDOWS_TARGET_ROOT/gen/runtime/$WINDOWS_WEBVIEW_BOOTSTRAPPER_RELATIVE_PATH"

  rm -rf "$WINDOWS_BUNDLE_DIR" "$WINDOWS_PORTABLE_DIR" "$WINDOWS_TARGET_ROOT/nsis"

  step "Generating Windows x64 bundle payload"
  windows_build_exit=0
  set +e
  # Unset CI to avoid cargo-xwin --ci rejecting CI=1 (expects true/false)
  if [ -d "/opt/homebrew/opt/llvm/bin" ]; then
    PATH="/opt/homebrew/opt/llvm/bin:$PATH" CI= run_host_tauri_build \
      --target "$WINDOWS_BUILD_TARGET" \
      --runner cargo-xwin
  else
    CI= run_host_tauri_build \
      --target "$WINDOWS_BUILD_TARGET" \
      --runner cargo-xwin
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
  if is_windows_host && command_exists makensis; then
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
      run_containerized_windows_nsis
      [ $? -eq 0 ] && windows_setup_ok=true
      set -e
    fi
  else
    warn "Using containerized NSIS on non-Windows host for deterministic setup generation."
    set +e
    run_containerized_windows_nsis
    [ $? -eq 0 ] && windows_setup_ok=true
    set -e
  fi

  if [ "$windows_setup_ok" = false ]; then
    die "NSIS setup build failed for requested Windows target."
  fi

  mkdir -p "$WINDOWS_BUNDLE_DIR"
  WINDOWS_SETUP_TARGET="$WINDOWS_BUNDLE_DIR/${APP_PRODUCT_NAME}_${APP_VERSION}_${WINDOWS_ARCH_LABEL}-setup.exe"
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

  step "Packaging Windows x64 portable archive"
  if [ ! -d "$WINDOWS_TARGET_ROOT/gen/runtime" ]; then
    die "Windows runtime directory not found: $WINDOWS_TARGET_ROOT/gen/runtime"
  fi
  if [ ! -f "$WINDOWS_PORTABLE_BOOTSTRAPPER_PATH" ]; then
    die "Windows portable runtime is missing the bundled WebView2 bootstrapper: $WINDOWS_PORTABLE_BOOTSTRAPPER_PATH"
  fi

  mkdir -p "$WINDOWS_PORTABLE_STAGE_DIR"
  cp "$WINDOWS_EXE_PATH" "$WINDOWS_PORTABLE_STAGE_DIR/${APP_BINARY_NAME}.exe"
  cp -R "$WINDOWS_TARGET_ROOT/gen" "$WINDOWS_PORTABLE_STAGE_DIR/gen"
  cat > "$WINDOWS_PORTABLE_STAGE_DIR/README.txt" <<EOF
BaoBuildBuddy Windows portable package

Run:
  ${APP_BINARY_NAME}.exe

Keep the gen directory next to the executable.
If Microsoft Edge WebView2 is not installed yet, BaoBuildBuddy will prompt to run:
  ${WINDOWS_WEBVIEW_BOOTSTRAPPER_DISPLAY_PATH}
EOF
  create_zip_archive "$WINDOWS_PORTABLE_STAGE_DIR" "$WINDOWS_PORTABLE_ZIP_PATH"
  ok "Windows portable archive staged"
fi

LINUX_ARTIFACTS_READY=false
if [ "$BUILD_LINUX" = true ]; then
  VERIFY_TARGETS+=("linux")
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
    # Desktop runtime preparation builds multiple workspaces inside the container,
    # but it does not need the root dev-only toolchain packages.
    bun install --frozen-lockfile \
      --filter "!./" \
      --filter "@bao/shared" \
      --filter "@bao/server" \
      --filter "@bao/client" \
      --filter "@bao/scraper" \
      --filter "@bao/desktop"
    cd "$LINUX_DOCKER_BUILD_ROOT/packages/desktop"
    export CARGO_TARGET_DIR="$LINUX_DOCKER_BUILD_ROOT/$LINUX_CARGO_TARGET_DIR"
    export APPIMAGE_EXTRACT_AND_RUN=1
    export CARGO_BUILD_JOBS=1
    set +e
    cargo tauri build \
      --target "$LINUX_BUILD_TARGET" \
      --bundles deb,rpm
    linux_build_exit=$?
    set -e
    mkdir -p "/repo/$LINUX_CARGO_TARGET_DIR/$LINUX_BUILD_TARGET"
    rm -rf "/repo/$LINUX_CARGO_TARGET_DIR/$LINUX_BUILD_TARGET/release"
    cp -RL "$CARGO_TARGET_DIR/$LINUX_BUILD_TARGET/release" "/repo/$LINUX_CARGO_TARGET_DIR/$LINUX_BUILD_TARGET/"
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
        APPDIR_ROOT="${LINUX_RELEASE_ROOT}/bundle/appimage/${APP_PRODUCT_NAME}.AppDir"
        DESKTOP_ENTRY_ROOT="${APPDIR_ROOT}/${APP_PRODUCT_NAME}.desktop"
        DESKTOP_ENTRY_SOURCE="${APPDIR_ROOT}/usr/share/applications/${APP_PRODUCT_NAME}.desktop"
        ICON_ROOT="${APPDIR_ROOT}/${APP_PRODUCT_NAME}.png"
        ICON_ALIAS_ROOT="${APPDIR_ROOT}/${APP_BINARY_NAME}.png"
        DIRICON_ROOT="${APPDIR_ROOT}/.DirIcon"
        if [ ! -e "$DESKTOP_ENTRY_ROOT" ] && [ -e "$DESKTOP_ENTRY_SOURCE" ]; then
          rm -f "$DESKTOP_ENTRY_ROOT"
          cp -L "$DESKTOP_ENTRY_SOURCE" "$DESKTOP_ENTRY_ROOT"
        fi
        if [ ! -e "$ICON_ALIAS_ROOT" ] && [ -e "$ICON_ROOT" ]; then
          cp "$ICON_ROOT" "$ICON_ALIAS_ROOT"
        fi
        if [ ! -e "$DIRICON_ROOT" ] && [ -e "$ICON_ROOT" ]; then
          rm -f "$DIRICON_ROOT"
          cp "$ICON_ROOT" "$DIRICON_ROOT"
        fi
        APPIMAGE_OUTPUT="${LINUX_RELEASE_ROOT}/bundle/appimage/${APP_PRODUCT_NAME}_${VERSION}_${LINUX_ARCH}.AppImage"
        /tmp/appimagetool-aarch64.AppImage \
          "$APPDIR_ROOT" \
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
  copy_latest_artifact "$RELEASE_ROOT/macos" \
    "$MACOS_HOST_BUNDLE_ROOT/dmg/${APP_PRODUCT_NAME}_*_${MACOS_ARCH}.dmg" \
    "$MACOS_TARGET_BUNDLE_ROOT/dmg/${APP_PRODUCT_NAME}_*_${MACOS_ARCH}.dmg"
fi

if [ "$BUILD_LINUX" = true ]; then
  rm -f "$RELEASE_ROOT/linux"/"${APP_PRODUCT_NAME}_"*.AppImage \
    "$RELEASE_ROOT/linux"/"${APP_PRODUCT_NAME}_"*.deb \
    "$RELEASE_ROOT/linux"/"${APP_PRODUCT_NAME}-"*.rpm
  copy_latest_artifact "$RELEASE_ROOT/linux" \
    "$LINUX_TARGET_ROOT/bundle/appimage/${APP_PRODUCT_NAME}_*_${LINUX_ARCH}.AppImage"
  copy_latest_artifact "$RELEASE_ROOT/linux" \
    "$LINUX_TARGET_ROOT/bundle/deb/${APP_PRODUCT_NAME}_*_${LINUX_DEB_ARCH}.deb"
  copy_latest_artifact "$RELEASE_ROOT/linux" \
    "$LINUX_TARGET_ROOT/bundle/rpm/${APP_PRODUCT_NAME}-*.${LINUX_ARCH}.rpm"
fi

if [ "$BUILD_WINDOWS" = true ]; then
  rm -f "$RELEASE_ROOT/windows"/"${APP_PRODUCT_NAME}_"*.exe "$RELEASE_ROOT/windows"/"${APP_PRODUCT_NAME}_"*.zip
  if latest_file_from_patterns \
    "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
    "$WINDOWS_TARGET_ROOT/nsis/x64/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
    >/dev/null; then
    copy_latest_artifact "$RELEASE_ROOT/windows" \
      "$WINDOWS_TARGET_ROOT/bundle/nsis/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe" \
      "$WINDOWS_TARGET_ROOT/nsis/x64/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-setup.exe"
  fi
  if latest_file_from_patterns \
    "$WINDOWS_TARGET_ROOT/bundle/portable/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-portable.zip" \
    >/dev/null; then
    copy_latest_artifact "$RELEASE_ROOT/windows" \
      "$WINDOWS_TARGET_ROOT/bundle/portable/${APP_PRODUCT_NAME}_*_${WINDOWS_ARCH_LABEL}-portable.zip"
  fi
fi

step "Regenerating release checksums"
cd "$RELEASE_ROOT"
artifacts=()
shopt -s nullglob
for artifact in macos/*.dmg linux/*.AppImage linux/*.deb linux/*.rpm windows/*.exe; do
  artifacts+=("$artifact")
done
for artifact in windows/*.zip; do
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

step "Verifying desktop release artifacts"
VERIFY_TARGETS_CSV="$(IFS=,; printf '%s' "${VERIFY_TARGETS[*]}")"
cd "$REPO_ROOT"
bun run scripts/verify-desktop-release-artifacts.ts --targets "$VERIFY_TARGETS_CSV"
ok "Desktop release artifacts verified"

NATIVE_RUNTIME_VERIFY_TARGET=""
case "$(uname -s)" in
  Darwin)
    if [ "$BUILD_MACOS" = true ]; then
      NATIVE_RUNTIME_VERIFY_TARGET="$MACOS_BUILD_TARGET"
    fi
    ;;
  Linux)
    if [ "$BUILD_LINUX" = true ]; then
      NATIVE_RUNTIME_VERIFY_TARGET="$LINUX_BUILD_TARGET"
    fi
    ;;
  CYGWIN*|MINGW*|MSYS*|Windows_NT)
    if [ "$BUILD_WINDOWS" = true ]; then
      NATIVE_RUNTIME_VERIFY_TARGET="$WINDOWS_BUILD_TARGET"
    fi
    ;;
esac

if [ -n "$NATIVE_RUNTIME_VERIFY_TARGET" ]; then
  step "Verifying packaged desktop runtime"
  bun run verify:desktop-runtime --target "$NATIVE_RUNTIME_VERIFY_TARGET"
  ok "Packaged desktop runtime verified"
fi

step "Release artifact summary"
ls -lh "$RELEASE_ROOT/macos" "$RELEASE_ROOT/linux" "$RELEASE_ROOT/windows"
ok "Desktop release refresh complete"
