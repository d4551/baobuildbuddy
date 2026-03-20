#!/usr/bin/env bash
# Run from repo root on a real Linux x86_64 host (or Docker on x86_64).
# Produces deb, rpm, and AppImage under .desktop-release-artifacts/linux-x64 when AppImage is enabled.
# Do not rely on Docker --platform linux/amd64 on Apple Silicon: QEMU can crash the Tauri CLI during the Rust build.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y \
  curl \
  ca-certificates \
  git \
  pkg-config \
  build-essential \
  file \
  cpio \
  rpm \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  squashfs-tools \
  libfuse2 \
  libwebkit2gtk-4.1-dev \
  wget
curl https://sh.rustup.rs -sSf | sh -s -- -y
# shellcheck disable=SC1090
source "$HOME/.cargo/env"
rustup default stable
bun install
bun run automation:browsers:install
export DESKTOP_RELEASE_LINUX_SIGNATURES="${DESKTOP_RELEASE_LINUX_SIGNATURES:-false}"
export DESKTOP_RELEASE_LINUX_APPIMAGE="${DESKTOP_RELEASE_LINUX_APPIMAGE:-true}"
env -u CI bun run release:desktop:linux-x64 -- --output-root .desktop-release-artifacts --include-linux-appimage --verbose
