import { z } from "zod";
import {
  DESKTOP_RELEASE_LINUX_ARM64_TARGET,
  DESKTOP_RELEASE_LINUX_X64_TARGET,
  DESKTOP_RELEASE_MACOS_TARGET,
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_RELEASE_WINDOWS_TARGET,
  DESKTOP_RUNTIME_CORS_ORIGINS,
  DESKTOP_RUNTIME_HOST,
  DESKTOP_RUNTIME_LINUX_BUN_PATH,
  DESKTOP_RUNTIME_SCRAPER_DIR,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH,
  DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
  DESKTOP_RUNTIME_SERVER_PORT,
  DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH,
} from "../constants/scripts";

/**
 * Canonical desktop runtime release targets.
 */
export type DesktopRuntimeReleaseTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

/**
 * Supported desktop runtime host platforms.
 */
export type DesktopRuntimeHostPlatform = Extract<NodeJS.Platform, "darwin" | "linux" | "win32">;

/**
 * Supported desktop runtime host architectures.
 */
export type DesktopRuntimeHostArch = "arm64" | "x64";

/**
 * Typed runtime manifest contract consumed by the desktop wrapper and verification scripts.
 */
export const desktopRuntimeManifestSchema = z.object({
  serverExecutable: z.string().min(1),
  scriptRunnerExecutable: z.string().min(1),
  scriptRunnerEntrypoint: z.string().min(1).nullable(),
  webviewBootstrapperExecutable: z.string().min(1).nullable().optional(),
  scraperDir: z.string().min(1),
  serverHost: z.string().min(1),
  serverPort: z.number().int().positive(),
  corsOrigins: z.array(z.string().min(1)),
});

/**
 * Parsed desktop runtime manifest shape.
 */
export type DesktopRuntimeManifest = z.infer<typeof desktopRuntimeManifestSchema>;

/**
 * Canonical per-target runtime layout resolved from Tauri target metadata.
 */
export type DesktopRuntimeTargetInfo = {
  readonly target: DesktopRuntimeReleaseTarget;
  readonly tauriTarget: string;
  readonly hostPlatform: DesktopRuntimeHostPlatform;
  readonly hostArch: DesktopRuntimeHostArch;
  readonly serverExecutable: string;
  readonly scriptRunnerExecutable: string;
  readonly scriptRunnerEntrypoint: string;
  readonly scraperDir: string;
  readonly defaultWebviewBootstrapperExecutable: string | null;
};

const WINDOWS_EXECUTABLE_SUFFIX = ".exe" as const;

const appendWindowsExecutableSuffix = (relativePath: string): string =>
  `${relativePath}${WINDOWS_EXECUTABLE_SUFFIX}`;

const DESKTOP_RUNTIME_TARGET_INFO = {
  macos: {
    defaultWebviewBootstrapperExecutable: null,
    hostArch: "arm64",
    hostPlatform: "darwin",
    scraperDir: DESKTOP_RUNTIME_SCRAPER_DIR,
    scriptRunnerEntrypoint: DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
    scriptRunnerExecutable: DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH,
    serverExecutable: DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
    tauriTarget: DESKTOP_RELEASE_MACOS_TARGET,
  },
  windows: {
    defaultWebviewBootstrapperExecutable: appendWindowsExecutableSuffix(
      DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH,
    ),
    hostArch: "x64",
    hostPlatform: "win32",
    scraperDir: DESKTOP_RUNTIME_SCRAPER_DIR,
    scriptRunnerEntrypoint: DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
    scriptRunnerExecutable: appendWindowsExecutableSuffix(DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH),
    serverExecutable: appendWindowsExecutableSuffix(DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH),
    tauriTarget: DESKTOP_RELEASE_WINDOWS_TARGET,
  },
  "linux-x64": {
    defaultWebviewBootstrapperExecutable: null,
    hostArch: "x64",
    hostPlatform: "linux",
    scraperDir: DESKTOP_RUNTIME_SCRAPER_DIR,
    scriptRunnerEntrypoint: DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
    scriptRunnerExecutable: DESKTOP_RUNTIME_LINUX_BUN_PATH,
    serverExecutable: DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
    tauriTarget: DESKTOP_RELEASE_LINUX_X64_TARGET,
  },
  "linux-arm64": {
    defaultWebviewBootstrapperExecutable: null,
    hostArch: "arm64",
    hostPlatform: "linux",
    scraperDir: DESKTOP_RUNTIME_SCRAPER_DIR,
    scriptRunnerEntrypoint: DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
    scriptRunnerExecutable: DESKTOP_RUNTIME_LINUX_BUN_PATH,
    serverExecutable: DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
    tauriTarget: DESKTOP_RELEASE_LINUX_ARM64_TARGET,
  },
} as const satisfies Record<
  DesktopRuntimeReleaseTarget,
  Omit<DesktopRuntimeTargetInfo, "target">
>;

/**
 * Resolves the canonical runtime layout for a release target.
 */
export const resolveDesktopRuntimeTargetInfo = (
  target: DesktopRuntimeReleaseTarget,
): DesktopRuntimeTargetInfo => ({
  target,
  ...DESKTOP_RUNTIME_TARGET_INFO[target],
});

/**
 * Resolves the canonical runtime layout from a Tauri target triple.
 */
export const resolveDesktopRuntimeTargetInfoFromTauriTarget = (
  tauriTarget: string,
): DesktopRuntimeTargetInfo => {
  const resolvedTarget = DESKTOP_RELEASE_TARGETS.find(
    (target) => DESKTOP_RUNTIME_TARGET_INFO[target].tauriTarget === tauriTarget,
  );
  if (!resolvedTarget) {
    throw new Error(`Unsupported desktop Tauri target: ${tauriTarget}`);
  }

  return resolveDesktopRuntimeTargetInfo(resolvedTarget);
};

/**
 * Resolves the canonical runtime layout from the current host platform.
 */
export const resolveDesktopRuntimeTargetInfoFromHost = (
  platform: NodeJS.Platform,
  arch: string,
): DesktopRuntimeTargetInfo => {
  if (platform === "darwin") {
    return resolveDesktopRuntimeTargetInfo("macos");
  }

  if (platform === "win32") {
    return resolveDesktopRuntimeTargetInfo("windows");
  }

  if (platform === "linux") {
    return resolveDesktopRuntimeTargetInfo(arch === "arm64" ? "linux-arm64" : "linux-x64");
  }

  throw new Error(`Unsupported desktop runtime host platform: ${platform}/${arch}`);
};

/**
 * Builds the canonical desktop runtime manifest for a target.
 */
export const buildDesktopRuntimeManifest = (
  target: DesktopRuntimeReleaseTarget,
  options: {
    readonly webviewBootstrapperExecutable?: string | null;
  } = {},
): DesktopRuntimeManifest => {
  const targetInfo = resolveDesktopRuntimeTargetInfo(target);

  return {
    corsOrigins: [...DESKTOP_RUNTIME_CORS_ORIGINS],
    scraperDir: targetInfo.scraperDir,
    scriptRunnerEntrypoint: targetInfo.scriptRunnerEntrypoint,
    scriptRunnerExecutable: targetInfo.scriptRunnerExecutable,
    serverExecutable: targetInfo.serverExecutable,
    serverHost: DESKTOP_RUNTIME_HOST,
    serverPort: DESKTOP_RUNTIME_SERVER_PORT,
    webviewBootstrapperExecutable:
      options.webviewBootstrapperExecutable ?? targetInfo.defaultWebviewBootstrapperExecutable,
  };
};

/**
 * Parses and normalizes a desktop runtime manifest payload.
 */
export const parseDesktopRuntimeManifest = (
  payload: unknown,
  sourceLabel: string,
): DesktopRuntimeManifest => {
  const parsedManifest = desktopRuntimeManifestSchema.safeParse(payload);
  if (!parsedManifest.success) {
    const flattenedErrors = parsedManifest.error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid desktop runtime manifest at ${sourceLabel}: ${flattenedErrors}`);
  }

  return {
    ...parsedManifest.data,
    webviewBootstrapperExecutable: parsedManifest.data.webviewBootstrapperExecutable ?? null,
  };
};

/**
 * Returns field-level mismatches between two runtime manifests.
 */
export const getDesktopRuntimeManifestMismatches = (
  actualManifest: DesktopRuntimeManifest,
  expectedManifest: DesktopRuntimeManifest,
): readonly string[] => {
  const mismatches: string[] = [];

  if (actualManifest.serverExecutable !== expectedManifest.serverExecutable) {
    mismatches.push(
      `serverExecutable expected=${expectedManifest.serverExecutable} actual=${actualManifest.serverExecutable}`,
    );
  }
  if (actualManifest.scriptRunnerExecutable !== expectedManifest.scriptRunnerExecutable) {
    mismatches.push(
      `scriptRunnerExecutable expected=${expectedManifest.scriptRunnerExecutable} actual=${actualManifest.scriptRunnerExecutable}`,
    );
  }
  if (actualManifest.scriptRunnerEntrypoint !== expectedManifest.scriptRunnerEntrypoint) {
    mismatches.push(
      `scriptRunnerEntrypoint expected=${expectedManifest.scriptRunnerEntrypoint ?? "null"} actual=${actualManifest.scriptRunnerEntrypoint ?? "null"}`,
    );
  }
  if (actualManifest.webviewBootstrapperExecutable !== expectedManifest.webviewBootstrapperExecutable) {
    mismatches.push(
      `webviewBootstrapperExecutable expected=${expectedManifest.webviewBootstrapperExecutable ?? "null"} actual=${actualManifest.webviewBootstrapperExecutable ?? "null"}`,
    );
  }
  if (actualManifest.scraperDir !== expectedManifest.scraperDir) {
    mismatches.push(
      `scraperDir expected=${expectedManifest.scraperDir} actual=${actualManifest.scraperDir}`,
    );
  }
  if (actualManifest.serverHost !== expectedManifest.serverHost) {
    mismatches.push(
      `serverHost expected=${expectedManifest.serverHost} actual=${actualManifest.serverHost}`,
    );
  }
  if (actualManifest.serverPort !== expectedManifest.serverPort) {
    mismatches.push(
      `serverPort expected=${expectedManifest.serverPort} actual=${actualManifest.serverPort}`,
    );
  }
  if (
    actualManifest.corsOrigins.length !== expectedManifest.corsOrigins.length ||
    actualManifest.corsOrigins.some((origin, index) => origin !== expectedManifest.corsOrigins[index])
  ) {
    mismatches.push(
      `corsOrigins expected=${expectedManifest.corsOrigins.join(",")} actual=${actualManifest.corsOrigins.join(",")}`,
    );
  }

  return mismatches;
};

/**
 * Lists files that must exist inside the runtime resource tree for a manifest.
 */
export const listDesktopRuntimeContractPaths = (
  manifest: DesktopRuntimeManifest,
  dependencyPackageNames: readonly string[],
): readonly string[] => {
  const manifestReferencedPaths = [
    "manifest.json",
    manifest.serverExecutable,
    manifest.scriptRunnerExecutable,
    manifest.scriptRunnerEntrypoint,
    manifest.webviewBootstrapperExecutable,
    `${manifest.scraperDir}/package.json`,
    ...dependencyPackageNames.map(
      (packageName) => `${manifest.scraperDir}/node_modules/${packageName}/package.json`,
    ),
  ];

  return manifestReferencedPaths.filter((path): path is string => typeof path === "string" && path.length > 0);
};
