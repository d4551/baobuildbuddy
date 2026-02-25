# Desktop Release Manifest

Canonical installer output manifest for this repository baseline

## Quality Gate Before Packaging

Run from repo root before desktop release packaging:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bun run build:desktop
```

Desktop release packaging additionally enforces these quality checks before execution:

```bash
bun run validate:no-try-catch
bun run validate:no-unsafe-casts
bun run validate:no-hardcoded-paths
bun run validate:locales
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:ui-layout-tokens
bun run validate:ui
bun run lint:typed
```

Packaging docs in this file assume the above succeeds without masked diagnostics.

`release:refresh:all-os` uses a headless fallback for macOS DMG creation:

- First attempt uses default DMG bundling (`bundle_dmg.sh`).
- If default DMG creation fails, if Finder-based styling fails, or if the expected `.dmg` artifact is missing, the script falls back to `bundle_dmg.sh --skip-jenkins`.
- The fallback produces a valid distributable `.dmg`, then continues to checksum and release staging.

If you need the same fallback manually:

```bash
APP_VERSION="$(awk -F '\"' '/^version = /{print $2; exit}' packages/desktop/src-tauri/Cargo.toml)"
APP_PRODUCT_NAME="$(awk -F '\"' '/\"productName\"[[:space:]]*:/ {print $4; exit}' packages/desktop/src-tauri/tauri.conf.json)"
MACOS_APP_PATH="$(/usr/bin/find packages/desktop/src-tauri/target -path "*/bundle/macos/${APP_PRODUCT_NAME}.app" -print | head -n 1)"
MACOS_DMG_PATH="packages/desktop/src-tauri/target/release/bundle/dmg/${APP_PRODUCT_NAME}_${APP_VERSION}_aarch64.dmg"
MACOS_DMG_SCRIPT="$(/usr/bin/find packages/desktop/src-tauri/target -path '*/bundle/dmg/bundle_dmg.sh' -print | head -n 1)"

mkdir -p "$(dirname "$MACOS_DMG_PATH")"
bash "$MACOS_DMG_SCRIPT" --skip-jenkins "$MACOS_DMG_PATH" "$MACOS_APP_PATH"
```

If a direct `bun run build:desktop` run exits with `failed to run bundle_dmg.sh` but still reports DMG completion, use the refresh fallback directly:

```bash
bash scripts/refresh-desktop-releases.sh --skip-quality-gates --skip-linux --skip-windows
```

Expected validation outcomes:

- `bun run lint`: no lint warnings or errors.
- `bun run --filter '@bao/client' lint`: no warnings or errors.
- `bun run typecheck`: no TypeScript diagnostics.
- `bun run test`: all workspace test suites pass.
- `bun run build`: all packages build successfully.
- `CI=true bun run build:desktop`: desktop packaging build succeeds.
- `bun run release:refresh:all-os`: all desktop target artifacts are rebuilt and checksummed.
- `bun run release:refresh:all-os:fast`: desktop target artifacts are rebuilt and checksummed without rerunning quality gates.

Optional SSR/page validation before packaging (when validating UI render contracts):

```bash
PORT=4105 bun run --filter '@bao/client' preview
VERIFY_HOST=127.0.0.1 VERIFY_PORT=4105 bun run verify:pages
```

## Packaging workflow (macOS host)

Use the canonical all-target refresh command:

```bash
bun run release:refresh:all-os
```

For fast local rebuilds after quality gates:

```bash
bun run release:refresh:all-os:fast
```

`bun run release:refresh:all-os:fast` is equivalent to `bash scripts/refresh-desktop-releases.sh --skip-quality-gates` and performs packaging + checksum regeneration only.

Host/runtime requirements:

- macOS host (required for DMG generation)
- Docker daemon running (required for Windows/Linux cross-target packaging)
- outbound network access for Ubuntu package mirrors and Bun/Rust/AppImage downloads

This command performs:

- release quality gates (`lint`, `typecheck`, `test`, `build`)
- macOS DMG build (`aarch64-apple-darwin`)
- Windows x64 portable and setup builds (`x86_64-pc-windows-msvc`)
- Linux ARM64 AppImage/deb/rpm builds (`aarch64-unknown-linux-gnu`)
- staging into `packages/desktop/releases/{macos,linux,windows}`
- checksum regeneration in `packages/desktop/releases/sha256.txt`
- containerized Windows NSIS fallback when local `makensis` is unavailable/fails
- Linux AppImage fallback using `appimagetool` when `linuxdeploy` bundling fails

Advanced target selection examples:

```bash
# Skip quality gates when only rebuilding artifacts
bash scripts/refresh-desktop-releases.sh --skip-quality-gates

# Rebuild only Linux + Windows artifacts
bash scripts/refresh-desktop-releases.sh --skip-macos

# Rebuild only macOS artifacts
bash scripts/refresh-desktop-releases.sh --skip-linux --skip-windows
```

## Canonical release directories

- `macos/`
- `linux/`
- `windows/`

Raw Tauri build outputs are created under `packages/desktop/src-tauri/target/release/bundle` and then copied into these canonical release directories.

## Artifacts

### macOS

- `macos/${APP_PRODUCT_NAME}_<VERSION>_aarch64.dmg`

### Linux

- `linux/${APP_PRODUCT_NAME}_<VERSION>_aarch64.AppImage`
- `linux/${APP_PRODUCT_NAME}_<VERSION>_arm64.deb`
- `linux/${APP_PRODUCT_NAME}-<VERSION>-1.aarch64.rpm`

### Windows

- `windows/${APP_PRODUCT_NAME}_<VERSION>_x64-setup.exe`
- `windows/${APP_PRODUCT_NAME}_<VERSION>_x64-portable.exe`

## Integrity

- SHA-256 checksums are recorded in `sha256.txt`.
