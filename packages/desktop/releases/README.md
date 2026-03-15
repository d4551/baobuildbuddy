# Desktop Release Manifest

Canonical installer output manifest for this repository baseline

## Quality Gate Before Packaging

For the full validation sequence and script verification commands, see [README.md § Release Validation Workflow](../../../README.md#release-validation-workflow). Packaging docs in this file assume those quality gates succeed without masked diagnostics.

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

Optional SSR/page validation before packaging (when validating UI render contracts):

```bash
PORT=4105 bun run --filter '@bao/client' preview
VERIFY_HOST=127.0.0.1 VERIFY_PORT=4105 bun run verify:pages
```

## Packaging workflow (macOS host)

```mermaid
flowchart TD
  Refresh["scripts/refresh-desktop-releases.sh"] --> QualityMode{"skip quality gates?"}

  subgraph QualityGates["Quality gates (release:refresh:all-os)"]
    Lint["bun run lint"]
    Typecheck["bun run typecheck"]
    Test["bun run test"]
    Build["bun run build"]
  end

  subgraph Targets["Cross-target builds"]
    MacOS["macOS DMG (aarch64-apple-darwin)"]
    Windows["Windows x64 (cargo-xwin + NSIS)"]
    Linux["Linux ARM64 (Docker + AppImage/deb/rpm)"]
  end

  subgraph Staging["Release staging"]
    Stage["packages/desktop/releases/{macos,linux,windows}"]
    Checksum["sha256.txt regeneration"]
  end

  QualityMode -->|No| QualityGates
  QualityMode -->|Yes| Targets
  QualityGates --> Targets
  MacOS --> Stage
  Windows --> Stage
  Linux --> Stage
  Stage --> Checksum
```

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
- Docker daemon running (required for Windows NSIS fallback and Linux cross-target packaging)
- `cargo-xwin` for Windows x64 cross-compilation (`cargo install cargo-xwin`)
- Outbound network access for Ubuntu package mirrors and Bun/Rust/AppImage downloads

This command performs:

- release quality gates (`lint`, `typecheck`, `test`, `build`)
- macOS DMG build (`aarch64-apple-darwin`)
- Windows x64 setup build (`x86_64-pc-windows-msvc`)
- Linux ARM64 AppImage/deb/rpm builds (`aarch64-unknown-linux-gnu`)
- staging into `packages/desktop/releases/{macos,linux,windows}`
- checksum regeneration in `packages/desktop/releases/sha256.txt`
- Bun-native post-staging verification via `bun run verify:desktop-releases`
- containerized Windows NSIS fallback when local `makensis` is unavailable/fails
- Linux AppImage fallback using `appimagetool` when `linuxdeploy` bundling fails

Windows note: the packaged runtime is `x64` only. There is no `x86` / `i686` desktop artifact. We only ship the NSIS setup installer in the canonical release set because the app requires the bundled `gen/runtime` resource tree next to the executable.

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

## Integrity

- SHA-256 checksums are recorded in `sha256.txt`.
- Run `bun run verify:desktop-releases` to validate version alignment, required Tauri icons, staged artifact names, bundle signatures, DMG integrity, and checksum matches.
