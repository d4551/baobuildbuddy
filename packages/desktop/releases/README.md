# Desktop Release Manifest

Generated: synchronized with current release artifacts

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
