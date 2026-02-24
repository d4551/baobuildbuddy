# Desktop Release Manifest

Generated: synchronized with current release artifacts

## Quality Gate Before Packaging

Run from repo root before desktop release packaging:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bun run build:desktop
```

Packaging docs in this file assume the above succeeds without masked diagnostics.

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

## Regeneration workflow (macOS host)

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

- `macos/BaoBuildBuddy_<VERSION>_aarch64.dmg`

### Linux

- `linux/BaoBuildBuddy_<VERSION>_aarch64.AppImage`
- `linux/BaoBuildBuddy_<VERSION>_arm64.deb`
- `linux/BaoBuildBuddy-<VERSION>-1.aarch64.rpm`

### Windows

- `windows/BaoBuildBuddy_<VERSION>_x64-setup.exe`
- `windows/BaoBuildBuddy_<VERSION>_x64-portable.exe`

## Integrity

- SHA-256 checksums are recorded in `sha256.txt`.
