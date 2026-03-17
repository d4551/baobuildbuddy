/**
 * Script-level defaults for repository automation and verification utilities.
 */

/** Default host for local verification scripts. */
export const DEFAULT_VERIFY_HOST = "127.0.0.1" as const;

/** Default port for local verification scripts. */
export const DEFAULT_VERIFY_PORT = "4105" as const;

/** How long preview server readiness checks are allowed to run. */
export const PREVIEW_READY_TIMEOUT_MS = 60_000 as const;

/** Poll interval for waiting on preview readiness. */
export const PREVIEW_POLL_INTERVAL_MS = 1_000 as const;

/** Maximum preview log lines retained for error reporting. */
export const PREVIEW_LOG_LIMIT = 40 as const;

/** Output separator width for verification summaries. */
export const PREVIEW_SEPARATOR_LENGTH = 72 as const;

/** Maximum allowed timeout for desktop image inspection when detaching. */
export const DISK_IMAGE_TIMEOUT_MS = 60_000 as const;

/** Supported desktop release staging targets. */
export const DESKTOP_RELEASE_TARGETS = ["macos", "linux-x64", "linux-arm64", "windows"] as const;

/** Default root used to stage native per-platform desktop release outputs before assembly. */
export const DESKTOP_RELEASE_STAGING_ROOT = ".desktop-release-artifacts" as const;

/** Metadata directory stored alongside assembled desktop release artifacts. */
export const DESKTOP_RELEASE_METADATA_DIR = "metadata" as const;

/** Per-target provenance manifest filename for assembled desktop release artifacts. */
export const DESKTOP_RELEASE_PROVENANCE_FILENAME = "provenance.json" as const;

/** Canonical macOS desktop release architecture label. */
export const DESKTOP_RELEASE_MACOS_ARCH = "aarch64" as const;

/** Canonical macOS desktop release target triple. */
export const DESKTOP_RELEASE_MACOS_TARGET = "aarch64-apple-darwin" as const;

/** Canonical Linux x64 release architecture label used by RPM bundles. */
export const DESKTOP_RELEASE_LINUX_X64_RPM_ARCH = "x86_64" as const;

/** Canonical Linux x64 release target triple. */
export const DESKTOP_RELEASE_LINUX_X64_TARGET = "x86_64-unknown-linux-gnu" as const;

/** Canonical Debian package architecture label used by Linux x64 desktop releases. */
export const DESKTOP_RELEASE_LINUX_X64_DEB_ARCH = "amd64" as const;

/** Canonical Linux ARM64 release architecture label used by RPM bundles. */
export const DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH = "aarch64" as const;

/** Canonical Linux ARM64 release target triple. */
export const DESKTOP_RELEASE_LINUX_ARM64_TARGET = "aarch64-unknown-linux-gnu" as const;

/** Canonical Debian package architecture label used by Linux ARM64 desktop releases. */
export const DESKTOP_RELEASE_LINUX_ARM64_DEB_ARCH = "arm64" as const;

/** Canonical Windows desktop release architecture label. */
export const DESKTOP_RELEASE_WINDOWS_ARCH = "x64" as const;

/** Canonical Windows desktop release target triple. */
export const DESKTOP_RELEASE_WINDOWS_TARGET = "x86_64-pc-windows-msvc" as const;

/** Relative resource directory bundled into the packaged desktop application. */
export const DESKTOP_RUNTIME_RESOURCE_DIR = "gen/runtime" as const;

/** Relative runtime manifest path bundled into the packaged desktop application. */
export const DESKTOP_RUNTIME_MANIFEST_PATH =
  `${DESKTOP_RUNTIME_RESOURCE_DIR}/manifest.json` as const;

/** Default loopback host used by the packaged desktop server runtime. */
export const DESKTOP_RUNTIME_HOST = "127.0.0.1" as const;

/** Default loopback port used by the packaged desktop server runtime. */
export const DESKTOP_RUNTIME_SERVER_PORT = 3000 as const;

/** Absolute HTTP base used by the packaged desktop client to reach the local server. */
export const DESKTOP_RUNTIME_API_BASE =
  `http://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_SERVER_PORT}` as const;

/** Absolute WebSocket base used by the packaged desktop client to reach the local server. */
export const DESKTOP_RUNTIME_WS_BASE =
  `ws://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_SERVER_PORT}` as const;

/** Packaged desktop webview origins that are allowed to access the local desktop server. */
export const DESKTOP_RUNTIME_CORS_ORIGINS = [
  "http://tauri.localhost",
  "https://tauri.localhost",
  "tauri://localhost",
] as const;

/** Relative output path for the compiled packaged desktop server executable. */
export const DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH = "server/bao-desktop-server" as const;

/** Relative output path for the compiled packaged Bun entrypoint runner executable. */
export const DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH = "bin/bao-bun-runner" as const;

/** Relative runtime path for the bundled Bun binary used by Linux packaged automation execution. */
export const DESKTOP_RUNTIME_LINUX_BUN_PATH = "bin/bao-bun" as const;

/** Relative runtime path for the bundled Bun entrypoint helper used by Linux packaged automation execution. */
export const DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH =
  "bin/bao-bun-entrypoint-runner.mjs" as const;

/** Windows WebView2 bootstrapper basename bundled into portable desktop runtime assets. */
export const DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_BASENAME = [
  "MicrosoftEdge",
  "Webview2Setup",
].join("");

/** Windows WebView2 bootstrapper filename bundled into portable desktop runtime assets. */
export const DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_FILENAME = `${DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_BASENAME}.exe`;

/** Relative output path for the bundled WebView2 bootstrapper used by portable Windows builds. */
export const DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH = [
  "bin",
  DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_BASENAME,
].join("/");

/** Relative runtime path containing packaged scraper sources and dependencies. */
export const DESKTOP_RUNTIME_SCRAPER_DIR = "scraper" as const;

/** Temporary loopback port used while prerendering the desktop static client build. */
export const DESKTOP_RUNTIME_BUILD_SERVER_PORT = 3399 as const;

/** Loopback port used by desktop runtime smoke tests for serving generated static assets. */
export const DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT = 4106 as const;

/** Launch timeout for the browser used by desktop runtime verification checks. */
export const DESKTOP_RUNTIME_VERIFY_BROWSER_LAUNCH_TIMEOUT_MS = 30_000 as const;

/** Required desktop PNG icon outputs recommended by Tauri for cross-platform bundling. */
export const DESKTOP_REQUIRED_PNG_ICON_SPECS = [
  { relativePath: "32x32.png", width: 32, height: 32 },
  { relativePath: "128x128.png", width: 128, height: 128 },
  { relativePath: "128x128@2x.png", width: 256, height: 256 },
  { relativePath: "icon.png", width: 512, height: 512 },
] as const;

/** Required native desktop icon files recommended by Tauri for macOS and Windows bundling. */
export const DESKTOP_REQUIRED_NATIVE_ICON_FILES = ["icon.icns", "icon.ico"] as const;

/** Timeout for PinchTab reachability checks. */
export const PINCHTAB_REQUEST_TIMEOUT_MS = 2_000 as const;

/** Timeout before waiting for PinchTab readiness. */
export const PINCHTAB_READY_TIMEOUT_MS = 15_000 as const;

/** Poll interval while waiting for PinchTab readiness. */
export const PINCHTAB_POLL_INTERVAL_MS = 250 as const;
