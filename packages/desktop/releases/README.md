# Desktop Release Manifest

Generated: synchronized with current release artifacts

## Regeneration workflow (macOS host)

Build commands used to regenerate canonical artifacts:

```bash
# macOS dmg (CI mode avoids Finder/AppleScript interactivity failures)
CI=true bun run --filter '@bao/desktop' build -- --target aarch64-apple-darwin --bundles dmg

# Windows x64 portable exe + generated NSIS script (cross-build)
PATH="/opt/homebrew/opt/llvm/bin:$PATH" \
  bun run --filter '@bao/desktop' build -- \
    --target x86_64-pc-windows-msvc \
    --runner cargo-xwin \
    --config "{\"build\":{\"beforeBuildCommand\":\"\"}}"

# Windows x64 setup.exe (compile NSIS script in Linux container)
docker run --rm --platform linux/arm64/v8 \
  -v "$PWD:$PWD" \
  -v "$HOME/Library/Caches/tauri:$HOME/Library/Caches/tauri" \
  -w "$PWD/packages/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/nsis/x64" \
  ubuntu:24.04 bash -lc '
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y nsis
    makensis -V2 installer.nsi
  '

# Linux ARM64 (native ARM container build)
docker run --rm --platform linux/arm64/v8 \
  -v "$PWD:/workspace" -w /workspace ubuntu:24.04 bash -lc '
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
      --target aarch64-unknown-linux-gnu --config "{\"build\":{\"beforeBuildCommand\":\"\"}}"
  '

# Linux ARM64 AppImage fallback from existing AppDir (when linuxdeploy fails)
docker run --rm --platform linux/arm64/v8 \
  -v "$PWD:/workspace" -w /workspace ubuntu:24.04 bash -lc '
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y curl ca-certificates libglib2.0-0 file squashfs-tools
    curl -L -o /tmp/appimagetool-aarch64.AppImage \
      https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-aarch64.AppImage
    chmod +x /tmp/appimagetool-aarch64.AppImage
    export APPIMAGE_EXTRACT_AND_RUN=1
    /tmp/appimagetool-aarch64.AppImage \
      packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy.AppDir \
      packages/desktop/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/BaoBuildBuddy_0.1.0_aarch64.AppImage
  '
```

After build, copy Tauri bundle outputs into `packages/desktop/releases/{macos,linux,windows}` and refresh `sha256.txt`.

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
