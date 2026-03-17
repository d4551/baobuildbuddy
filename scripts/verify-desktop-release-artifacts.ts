import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_LINUX_ARM64_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH,
  DESKTOP_RELEASE_LINUX_X64_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_X64_RPM_ARCH,
  DESKTOP_RELEASE_MACOS_ARCH,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_RELEASE_WINDOWS_ARCH,
  DESKTOP_REQUIRED_NATIVE_ICON_FILES,
  DESKTOP_REQUIRED_PNG_ICON_SPECS,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DESKTOP_RUNTIME_SCRAPER_DIR,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH,
  DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
  DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_FILENAME,
  DISK_IMAGE_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";
import { collectRuntimeDependencySourceRoots } from "./utils/desktop-runtime-scraper";
import { captureResult, toErrorMessage } from "./utils/async-control";
import { writeError, writeOutput } from "./utils/cli-output";

type DesktopReleaseTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

type DesktopPackageJson = {
  readonly version?: unknown;
};

type TauriConfig = {
  readonly productName?: unknown;
  readonly version?: unknown;
  readonly identifier?: unknown;
  readonly app?: {
    readonly enableGTKAppId?: unknown;
  };
  readonly bundle?: {
    readonly icon?: unknown;
    readonly targets?: unknown;
    readonly windows?: {
      readonly webviewInstallMode?: {
        readonly type?: unknown;
      };
    };
  };
};

type CargoPackageMetadata = {
  readonly binaryName: string;
  readonly version: string;
};

type DesktopBundleMetadata = {
  readonly binaryName: string;
  readonly bundleIcons: readonly string[];
  readonly enableGtkAppId: boolean;
  readonly identifier: string;
  readonly productName: string;
  readonly tauriTargets: string | readonly string[];
  readonly webviewInstallMode: string | null;
  readonly version: string;
  readonly packageVersion: string;
  readonly cargoVersion: string;
};

type ReleaseArtifactKind = "appimage" | "deb" | "dmg" | "portable" | "rpm" | "setup";

type ReleaseArtifact = {
  readonly kind: ReleaseArtifactKind;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly target: DesktopReleaseTarget;
};

type VerificationResult = {
  readonly label: string;
  readonly ok: boolean;
  readonly details: string;
};

type ReleaseProvenance = {
  readonly schemaVersion?: unknown;
  readonly target?: unknown;
  readonly strategy?: unknown;
  readonly tauriCli?: unknown;
  readonly hostPlatform?: unknown;
  readonly hostArch?: unknown;
  readonly tauriTarget?: unknown;
  readonly artifactNames?: unknown;
  readonly buildCommands?: unknown;
  readonly builtAt?: unknown;
};

type AssembledReleaseProvenance = {
  readonly schemaVersion?: unknown;
  readonly assembledAt?: unknown;
  readonly sourceRoot?: unknown;
  readonly targets?: unknown;
};

type CommandCapture = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_ROOT = join(REPO_ROOT, "packages", "desktop");
const DESKTOP_RELEASE_ROOT = join(DESKTOP_ROOT, "releases");
const DESKTOP_TAURI_ROOT = join(DESKTOP_ROOT, "src-tauri");
const DESKTOP_ICON_ROOT = join(DESKTOP_TAURI_ROOT, "icons");
const DESKTOP_PACKAGE_JSON_PATH = join(DESKTOP_ROOT, "package.json");
const DESKTOP_TAURI_CONFIG_PATH = join(DESKTOP_TAURI_ROOT, "tauri.conf.json");
const DESKTOP_CARGO_TOML_PATH = join(DESKTOP_TAURI_ROOT, "Cargo.toml");
const DESKTOP_RELEASE_CHECKSUM_PATH = join(DESKTOP_RELEASE_ROOT, "sha256.txt");
const DESKTOP_RELEASE_PROVENANCE_PATH = join(
  DESKTOP_RELEASE_ROOT,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
);
const DESKTOP_RELEASE_METADATA_ROOT = join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_METADATA_DIR);
const DESKTOP_WINDOWS_NSIS_SCRIPT_PATH = join(
  DESKTOP_RELEASE_METADATA_ROOT,
  "windows",
  "installer.nsi",
);
const WINDOWS_NSIS_SCRAPER_INSTALL_MARKER = ["$INSTDIR", "gen", "runtime", "scraper"].join("\\");

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_SIGNATURE = Uint8Array.from([0, 0, 1, 0]);
const ICNS_SIGNATURE = Uint8Array.from([105, 99, 110, 115]);
const APPIMAGE_SIGNATURE = Uint8Array.from([65, 73, 2]);
const DEB_SIGNATURE = Uint8Array.from([33, 60, 97, 114, 99, 104, 62, 10]);
const RPM_SIGNATURE = Uint8Array.from([237, 171, 238, 219]);
const ZIP_SIGNATURE = Uint8Array.from([80, 75, 3, 4]);
const WINDOWS_EXE_SIGNATURE = Uint8Array.from([77, 90]);
const ZIP_LIST_TIMEOUT_MS = 30_000;
const WINDOWS_NSIS_WEBVIEW_BOOTSTRAPPER_MARKER = [
  '"/oname=gen\\runtime\\bin\\',
  DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_FILENAME,
  '"',
].join("");
const REQUIRED_ICO_LAYER_SIZES = [16, 24, 32, 48, 64, 256] as const;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u;
const SHA256_ENTRY_PATTERN = /^([a-f0-9]{64}) {2}(.+)$/u;
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const CARGO_PACKAGE_NAME_PATTERN = /^name = "([^"]+)"/m;
const LEADING_DOT_SLASH_PATTERN = /^\.\/+/u;
const LEADING_SLASH_PATTERN = /^\/+/u;
const WHITESPACE_PATTERN = /\s+/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readJsonObject = async <T extends object>(absolutePath: string): Promise<T> => {
  const parsed: unknown = JSON.parse(await Bun.file(absolutePath).text());
  if (isRecord(parsed)) {
    return parsed as T;
  }

  await writeError(`Expected JSON object in ${absolutePath}.`);
  process.exit(1);
};

const bytesStartWith = (bytes: Uint8Array, signature: Uint8Array, offset = 0): boolean =>
  signature.every((byte, index) => bytes[offset + index] === byte);

const pathExists = async (absolutePath: string): Promise<boolean> =>
  stat(absolutePath).then(
    () => true,
    () => false,
  );

const requireCommand = (
  label: string,
  command: string,
): VerificationResult | null => {
  if (Bun.which(command)) {
    return null;
  }

  return {
    details: `${command} is required on PATH for ${label}`,
    label: `tool:${command}`,
    ok: false,
  };
};

const parseCommandTargets = (argv: readonly string[]): readonly DesktopReleaseTarget[] => {
  const targetsIndex = argv.indexOf("--targets");
  if (targetsIndex === -1) {
    return DESKTOP_RELEASE_TARGETS;
  }

  const rawTargets = argv[targetsIndex + 1] ?? "";
  const requestedTargets = rawTargets
    .split(",")
    .map((target) => target.trim())
    .filter((target) => target.length > 0);

  const parsedTargets = DESKTOP_RELEASE_TARGETS.filter((target) =>
    requestedTargets.includes(target),
  );
  if (parsedTargets.length === 0) {
    throw new Error(`No supported desktop targets were supplied via --targets (${rawTargets}).`);
  }

  return parsedTargets;
};

const readCargoMetadata = async (): Promise<CargoPackageMetadata> => {
  const cargoToml = await Bun.file(DESKTOP_CARGO_TOML_PATH).text();
  const binaryName = cargoToml.match(CARGO_PACKAGE_NAME_PATTERN)?.[1]?.trim();
  const version = cargoToml.match(CARGO_VERSION_PATTERN)?.[1]?.trim();

  if (!(binaryName && version)) {
    await writeError("Unable to resolve desktop Cargo package metadata.");
    process.exit(1);
  }

  return {
    binaryName,
    version,
  };
};

const resolveTauriVersion = async (configVersion: unknown): Promise<string> => {
  const versionValue = toText(configVersion);
  if (!versionValue) {
    await writeError("Tauri config is missing a version field.");
    process.exit(1);
  }

  if (versionValue.endsWith(".json")) {
    const versionSource = await readJsonObject<DesktopPackageJson>(
      join(DESKTOP_TAURI_ROOT, versionValue),
    );
    const resolvedVersion = toText(versionSource.version);
    if (!resolvedVersion) {
      await writeError(`Version source ${versionValue} does not expose a string version.`);
      process.exit(1);
    }
    return resolvedVersion;
  }

  return versionValue;
};

const readDesktopMetadata = async (): Promise<DesktopBundleMetadata> => {
  const packageJson = await readJsonObject<DesktopPackageJson>(DESKTOP_PACKAGE_JSON_PATH);
  const tauriConfig = await readJsonObject<TauriConfig>(DESKTOP_TAURI_CONFIG_PATH);
  const cargoMetadata = await readCargoMetadata();

  const productName = toText(tauriConfig.productName);
  const identifier = toText(tauriConfig.identifier);
  const packageVersion = toText(packageJson.version);
  const version = await resolveTauriVersion(tauriConfig.version);
  const bundleIcons = Array.isArray(tauriConfig.bundle?.icon)
    ? tauriConfig.bundle.icon.filter((iconPath): iconPath is string => typeof iconPath === "string")
    : [];
  const tauriTargets =
    typeof tauriConfig.bundle?.targets === "string" || Array.isArray(tauriConfig.bundle?.targets)
      ? tauriConfig.bundle.targets
      : "all";
  const webviewInstallMode = toText(tauriConfig.bundle?.windows?.webviewInstallMode?.type);

  if (!(productName && identifier && packageVersion)) {
    await writeError("Desktop package metadata is incomplete in package.json or tauri.conf.json.");
    process.exit(1);
  }

  return {
    binaryName: cargoMetadata.binaryName,
    bundleIcons,
    cargoVersion: cargoMetadata.version,
    enableGtkAppId: tauriConfig.app?.enableGTKAppId === true,
    identifier,
    packageVersion,
    productName,
    tauriTargets,
    webviewInstallMode,
    version,
  };
};

const readReleaseProvenance = async (): Promise<ReadonlyMap<DesktopReleaseTarget, ReleaseProvenance>> => {
  if (!(await pathExists(DESKTOP_RELEASE_PROVENANCE_PATH))) {
    throw new Error(`Missing release provenance manifest: ${DESKTOP_RELEASE_PROVENANCE_PATH}`);
  }

  const parsed = await readJsonObject<AssembledReleaseProvenance>(DESKTOP_RELEASE_PROVENANCE_PATH);
  if (!isRecord(parsed.targets)) {
    throw new Error("Release provenance manifest is missing target entries.");
  }

  const provenanceEntries = new Map<DesktopReleaseTarget, ReleaseProvenance>();
  for (const target of DESKTOP_RELEASE_TARGETS) {
    const entry = parsed.targets[target];
    if (isRecord(entry)) {
      provenanceEntries.set(target, entry);
    }
  }

  return provenanceEntries;
};

const createReleaseArtifact = (
  target: DesktopReleaseTarget,
  relativePath: string,
  kind: ReleaseArtifactKind,
): ReleaseArtifact => ({
  absolutePath: join(DESKTOP_RELEASE_ROOT, relativePath),
  kind,
  relativePath,
  target,
});

const buildMacosArtifacts = (metadata: DesktopBundleMetadata): readonly ReleaseArtifact[] => {
  const relativePath = join(
    "macos",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_MACOS_ARCH}.dmg`,
  );
  return [createReleaseArtifact("macos", relativePath, "dmg")] as const;
};

const buildLinuxArtifacts = (
  metadata: DesktopBundleMetadata,
  target: Extract<DesktopReleaseTarget, "linux-x64" | "linux-arm64">,
): readonly ReleaseArtifact[] => {
  const debArch =
    target === "linux-x64" ? DESKTOP_RELEASE_LINUX_X64_DEB_ARCH : DESKTOP_RELEASE_LINUX_ARM64_DEB_ARCH;
  const rpmArch =
    target === "linux-x64" ? DESKTOP_RELEASE_LINUX_X64_RPM_ARCH : DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH;
  const debPath = join(
    target,
    `${metadata.productName}_${metadata.version}_${debArch}.deb`,
  );
  const rpmPath = join(
    target,
    `${metadata.productName}-${metadata.version}-1.${rpmArch}.rpm`,
  );

  return [
    createReleaseArtifact(target, debPath, "deb"),
    createReleaseArtifact(target, rpmPath, "rpm"),
  ] as const;
};

const buildWindowsArtifacts = (metadata: DesktopBundleMetadata): readonly ReleaseArtifact[] => {
  const setupPath = join(
    "windows",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-setup.exe`,
  );
  const portablePath = join(
    "windows",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-portable.zip`,
  );

  return [
    createReleaseArtifact("windows", setupPath, "setup"),
    createReleaseArtifact("windows", portablePath, "portable"),
  ] as const;
};

const buildArtifactsForTarget = (
  metadata: DesktopBundleMetadata,
  target: DesktopReleaseTarget,
): readonly ReleaseArtifact[] => {
  if (target === "macos") {
    return buildMacosArtifacts(metadata);
  }

  if (target === "linux-x64" || target === "linux-arm64") {
    return buildLinuxArtifacts(metadata, target);
  }

  return buildWindowsArtifacts(metadata);
};

const collectExpectedArtifacts = (
  metadata: DesktopBundleMetadata,
  targets: readonly DesktopReleaseTarget[],
): readonly ReleaseArtifact[] =>
  targets.flatMap((target) => buildArtifactsForTarget(metadata, target));

const readFilePrefix = async (absolutePath: string, length: number): Promise<Uint8Array> => {
  const file = Bun.file(absolutePath);
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
};

const verifyPngIcon = async (
  relativePath: string,
  width: number,
  height: number,
): Promise<VerificationResult> => {
  const absolutePath = join(DESKTOP_ICON_ROOT, relativePath);
  if (!(await pathExists(absolutePath))) {
    return {
      details: `${relativePath} is missing`,
      label: `icon:${relativePath}`,
      ok: false,
    };
  }

  const bytes = new Uint8Array(await Bun.file(absolutePath).arrayBuffer());
  const pngView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const actualWidth = pngView.getUint32(16);
  const actualHeight = pngView.getUint32(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const isPng = bytesStartWith(bytes, PNG_SIGNATURE);
  const ok =
    isPng && actualWidth === width && actualHeight === height && bitDepth === 8 && colorType === 6;

  return {
    details: ok
      ? `${relativePath} ${actualWidth}x${actualHeight} rgba8`
      : `${relativePath} expected ${width}x${height} rgba8, received ${actualWidth}x${actualHeight} bitDepth=${bitDepth} colorType=${colorType}`,
    label: `icon:${relativePath}`,
    ok,
  };
};

const verifyIcnsIcon = async (): Promise<VerificationResult> => {
  const absolutePath = join(DESKTOP_ICON_ROOT, "icon.icns");
  if (!(await pathExists(absolutePath))) {
    return {
      details: "icon.icns is missing",
      label: "icon:icon.icns",
      ok: false,
    };
  }

  const bytes = new Uint8Array(await Bun.file(absolutePath).arrayBuffer());
  const icnsView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const declaredSize = icnsView.getUint32(4);
  const ok = bytesStartWith(bytes, ICNS_SIGNATURE) && declaredSize === bytes.byteLength;

  return {
    details: ok
      ? `icon.icns ${declaredSize} bytes`
      : `icon.icns expected valid icns header and size, received declaredSize=${declaredSize} actual=${bytes.byteLength}`,
    label: "icon:icon.icns",
    ok,
  };
};

const verifyIcoIcon = async (): Promise<VerificationResult> => {
  const absolutePath = join(DESKTOP_ICON_ROOT, "icon.ico");
  if (!(await pathExists(absolutePath))) {
    return {
      details: "icon.ico is missing",
      label: "icon:icon.ico",
      ok: false,
    };
  }

  const bytes = new Uint8Array(await Bun.file(absolutePath).arrayBuffer());
  const icoView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const iconCount = icoView.getUint16(4, true);
  const layerSizes = new Set<number>();

  for (let entryIndex = 0; entryIndex < iconCount; entryIndex += 1) {
    const entryOffset = 6 + entryIndex * 16;
    const width = bytes[entryOffset] === 0 ? 256 : bytes[entryOffset];
    const height = bytes[entryOffset + 1] === 0 ? 256 : bytes[entryOffset + 1];
    if (width === height) {
      layerSizes.add(width);
    }
  }

  const missingLayerSizes = REQUIRED_ICO_LAYER_SIZES.filter((size) => !layerSizes.has(size));
  const ok = bytesStartWith(bytes, ICO_SIGNATURE) && missingLayerSizes.length === 0;

  return {
    details: ok
      ? `icon.ico layers ${Array.from(layerSizes)
          .sort((left, right) => left - right)
          .join(",")}`
      : `icon.ico missing layers ${missingLayerSizes.join(",")} from ${Array.from(layerSizes)
          .sort((left, right) => left - right)
          .join(",")}`,
    label: "icon:icon.ico",
    ok,
  };
};

const verifyBundleIconConfig = (metadata: DesktopBundleMetadata): VerificationResult => {
  const requiredIcons = [
    ...DESKTOP_REQUIRED_PNG_ICON_SPECS.map((iconSpec) => `icons/${iconSpec.relativePath}`),
    ...DESKTOP_REQUIRED_NATIVE_ICON_FILES.map((iconFile) => `icons/${iconFile}`),
  ];
  const missingIcons = requiredIcons.filter((iconPath) => !metadata.bundleIcons.includes(iconPath));

  return {
    details:
      missingIcons.length === 0
        ? `bundle icon manifest includes ${requiredIcons.length} required files`
        : `bundle icon manifest missing ${missingIcons.join(", ")}`,
    label: "config:bundle-icons",
    ok: missingIcons.length === 0,
  };
};

const verifyBundleConfig = (
  metadata: DesktopBundleMetadata,
  targets: readonly DesktopReleaseTarget[],
): readonly VerificationResult[] => {
  const versionAligned =
    metadata.packageVersion === metadata.cargoVersion && metadata.cargoVersion === metadata.version;
  const versionResult: VerificationResult = {
    details: versionAligned
      ? `package.json, Cargo.toml, and tauri.conf resolve to ${metadata.version}`
      : `package.json=${metadata.packageVersion} cargo=${metadata.cargoVersion} tauri=${metadata.version}`,
    label: "config:version-alignment",
    ok: versionAligned,
  };

  const identifierResult: VerificationResult = {
    details: metadata.identifier,
    label: "config:identifier",
    ok: IDENTIFIER_PATTERN.test(metadata.identifier),
  };

  const targetResult: VerificationResult = {
    details:
      typeof metadata.tauriTargets === "string"
        ? metadata.tauriTargets
        : metadata.tauriTargets.join(","),
    label: "config:bundle-targets",
    ok:
      metadata.tauriTargets === "all" ||
      (Array.isArray(metadata.tauriTargets) &&
        ["deb", "dmg", "nsis", "rpm"].every((target) =>
          metadata.tauriTargets.includes(target),
        )),
  };

  const gtkResult: VerificationResult | null = targets.some((target) => target.startsWith("linux"))
    ? {
        details: metadata.enableGtkAppId ? "enabled" : "disabled",
        label: "config:gtk-app-id",
        ok: metadata.enableGtkAppId,
      }
    : null;

  const webviewResult: VerificationResult | null = targets.includes("windows")
    ? {
        details: metadata.webviewInstallMode ?? "missing",
        label: "config:webview-install-mode",
        ok: metadata.webviewInstallMode === "embedBootstrapper",
      }
    : null;

  return [
    versionResult,
    identifierResult,
    targetResult,
    verifyBundleIconConfig(metadata),
    ...(gtkResult ? [gtkResult] : []),
    ...(webviewResult ? [webviewResult] : []),
  ];
};

const expectedHostPlatformForTarget = (target: DesktopReleaseTarget): NodeJS.Platform =>
  target === "macos" ? "darwin" : target === "windows" ? "win32" : "linux";

const expectedHostArchForTarget = (target: DesktopReleaseTarget): string =>
  target === "macos" || target === "linux-arm64" ? "arm64" : "x64";

const expectedTauriTargetForTarget = (target: DesktopReleaseTarget): string => {
  if (target === "macos") {
    return "aarch64-apple-darwin";
  }
  if (target === "windows") {
    return "x86_64-pc-windows-msvc";
  }
  return target === "linux-arm64"
    ? "aarch64-unknown-linux-gnu"
    : "x86_64-unknown-linux-gnu";
};

const normalizeArchiveEntry = (entry: string): string =>
  entry.trim().replace(LEADING_DOT_SLASH_PATTERN, "").replace(LEADING_SLASH_PATTERN, "");

const joinArchiveEntry = (...segments: readonly string[]): string =>
  normalizeArchiveEntry(segments.filter((segment) => segment.length > 0).join("/"));

const buildRuntimePackageEntries = (
  target: DesktopReleaseTarget,
  metadata: DesktopBundleMetadata,
  dependencyPackageNames: readonly string[],
): readonly string[] => {
  if (target === "macos") {
    const appRoot = joinArchiveEntry(`${metadata.productName}.app`, "Contents");
    const runtimeRoot = joinArchiveEntry(appRoot, "Resources", DESKTOP_RUNTIME_RESOURCE_DIR);
    return [
      joinArchiveEntry(appRoot, "MacOS", metadata.binaryName),
      joinArchiveEntry(runtimeRoot, "manifest.json"),
      joinArchiveEntry(runtimeRoot, DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH),
      joinArchiveEntry(runtimeRoot, DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH),
      joinArchiveEntry(runtimeRoot, DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH),
      joinArchiveEntry(runtimeRoot, DESKTOP_RUNTIME_SCRAPER_DIR, "package.json"),
      ...dependencyPackageNames.map((packageName) =>
        joinArchiveEntry(
          runtimeRoot,
          DESKTOP_RUNTIME_SCRAPER_DIR,
          "node_modules",
          packageName,
          "package.json",
        ),
      ),
    ] as const;
  }

  const linuxRoot = joinArchiveEntry("usr", "lib", metadata.productName);
  const linuxRuntimeRoot = joinArchiveEntry(linuxRoot, DESKTOP_RUNTIME_RESOURCE_DIR);
  const linuxDependencyPackageNames = dependencyPackageNames.filter(
    (packageName) => !MACOS_ONLY_PACKAGES.has(packageName),
  );

  return [
    joinArchiveEntry("usr", "bin", metadata.binaryName),
    joinArchiveEntry(linuxRuntimeRoot, "manifest.json"),
    joinArchiveEntry(linuxRuntimeRoot, DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH),
    joinArchiveEntry(linuxRuntimeRoot, DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH),
    joinArchiveEntry(linuxRuntimeRoot, DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH),
    joinArchiveEntry(linuxRuntimeRoot, DESKTOP_RUNTIME_SCRAPER_DIR, "package.json"),
    ...linuxDependencyPackageNames.map((packageName) =>
      joinArchiveEntry(
        linuxRuntimeRoot,
        DESKTOP_RUNTIME_SCRAPER_DIR,
        "node_modules",
        packageName,
        "package.json",
      ),
    ),
  ] as const;
};

const collectRelativeEntries = async (
  rootPath: string,
  entryPrefix = "",
): Promise<readonly string[]> => {
  const directoryEntries = await readdir(rootPath, { withFileTypes: true });
  const nestedEntries = await Promise.all(
    directoryEntries.map(async (directoryEntry) => {
      const absolutePath = join(rootPath, directoryEntry.name);
      const relativePath = joinArchiveEntry(entryPrefix, directoryEntry.name);
      if (directoryEntry.isDirectory()) {
        return collectRelativeEntries(absolutePath, relativePath);
      }
      return [relativePath] as const;
    }),
  );

  return nestedEntries.flat();
};

const verifyReleaseProvenance = async (
  metadata: DesktopBundleMetadata,
  targets: readonly DesktopReleaseTarget[],
): Promise<readonly VerificationResult[]> => {
  const provenanceEntriesResult = await captureResult(() => readReleaseProvenance());
  if (!provenanceEntriesResult.ok) {
    return [
      {
        details: toErrorMessage(provenanceEntriesResult.error),
        label: "provenance:manifest",
        ok: false,
      },
    ] as const;
  }

  const provenanceEntries = provenanceEntriesResult.value;
  return targets.map((target) => {
    const provenance = provenanceEntries.get(target);
    if (!provenance) {
      return {
        details: `missing provenance entry for ${target}`,
        label: `provenance:${target}`,
        ok: false,
      };
    }

    const artifactNames = Array.isArray(provenance.artifactNames)
      ? provenance.artifactNames.filter((artifactName): artifactName is string =>
        typeof artifactName === "string")
      : [];
    const expectedArtifactNames = buildArtifactsForTarget(metadata, target)
      .map((artifact) => basename(artifact.relativePath))
      .sort((left, right) => left.localeCompare(right));
    const actualArtifactNames = [...artifactNames].sort((left, right) => left.localeCompare(right));
    const details = [
      `strategy=${toText(provenance.strategy) ?? "missing"}`,
      `tauriCli=${toText(provenance.tauriCli) ?? "missing"}`,
      `hostPlatform=${toText(provenance.hostPlatform) ?? "missing"}`,
      `hostArch=${toText(provenance.hostArch) ?? "missing"}`,
      `tauriTarget=${toText(provenance.tauriTarget) ?? "missing"}`,
      `artifacts=${actualArtifactNames.join(",") || "missing"}`,
    ].join(" ");

    return {
      details,
      label: `provenance:${target}`,
      ok:
        provenance.strategy === "matching-host-native" &&
        provenance.tauriCli === "repo-local-bun" &&
        provenance.hostPlatform === expectedHostPlatformForTarget(target) &&
        provenance.hostArch === expectedHostArchForTarget(target) &&
        provenance.tauriTarget === expectedTauriTargetForTarget(target) &&
        actualArtifactNames.length === expectedArtifactNames.length &&
        actualArtifactNames.every((artifactName, index) => artifactName === expectedArtifactNames[index]),
    };
  });
};

const computeSha256 = (absolutePath: string): Promise<string> =>
  new Promise((resolveHash, rejectHash) => {
    const hasher = createHash("sha256");
    const stream = createReadStream(absolutePath);
    stream.on("data", (chunk) => {
      hasher.update(chunk);
    });
    stream.on("end", () => {
      resolveHash(hasher.digest("hex"));
    });
    stream.on("error", rejectHash);
  });

const captureCommand = (command: readonly string[], timeoutMs: number): Promise<CommandCapture> =>
  new Promise((resolveCommand) => {
    const proc = Bun.spawn(command, {
      cwd: REPO_ROOT,
      stdout: "pipe",
      stderr: "pipe",
      env: process.env,
    });

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeoutMs);

    const stdoutPromise =
      proc.stdout instanceof ReadableStream
        ? new Response(proc.stdout).text()
        : Promise.resolve("");
    const stderrPromise =
      proc.stderr instanceof ReadableStream
        ? new Response(proc.stderr).text()
        : Promise.resolve("");

    const settleCapture = async (): Promise<void> => {
      const [exitCode, stdout, stderr] = await Promise.all([
        proc.exited,
        stdoutPromise,
        stderrPromise,
      ]);
      clearTimeout(timeout);
      resolveCommand({
        exitCode: timedOut ? 124 : exitCode,
        stderr: stderr.trim(),
        stdout: stdout.trim(),
        timedOut,
      });
    };

    settleCapture().catch((error: unknown) => {
      clearTimeout(timeout);
      resolveCommand({
        exitCode: 1,
        stderr: error instanceof Error ? error.message : String(error),
        stdout: "",
        timedOut,
      });
    });
  });

const listZipEntriesWithCommandIndex = async (
  commandCandidates: readonly (readonly string[])[],
  index: number,
): Promise<readonly string[]> => {
  const command = commandCandidates[index];
  if (!command) {
    throw new Error("No zip listing command succeeded.");
  }

  const commandResult = await captureCommand(command, ZIP_LIST_TIMEOUT_MS);
  if (commandResult.exitCode === 0) {
    const entries = commandResult.stdout
      .split(/\r?\n/gu)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (entries.length > 0) {
      return entries;
    }
  }

  return listZipEntriesWithCommandIndex(commandCandidates, index + 1);
};

const listZipEntries = async (absolutePath: string): Promise<readonly string[]> => {
  const commandCandidates = [
    ["unzip", "-Z1", absolutePath],
    ["zipinfo", "-1", absolutePath],
    ...(process.platform === "win32"
      ? [
          [
            "powershell",
            "-NoProfile",
            "-Command",
            [
              "Add-Type -AssemblyName System.IO.Compression.FileSystem;",
              `$archive = [System.IO.Compression.ZipFile]::OpenRead('${absolutePath.replaceAll("'", "''")}');`,
              "$archive.Entries | ForEach-Object { $_.FullName };",
              "$archive.Dispose();",
            ].join(" "),
          ] as const,
        ]
      : []),
  ] as const;

  return listZipEntriesWithCommandIndex(commandCandidates, 0).catch(() => {
    throw new Error(`Unable to list zip entries for ${absolutePath}.`);
  });
};

const verifyDmgArtifact = async (artifact: ReleaseArtifact): Promise<VerificationResult> => {
  const commandResult = await captureCommand(
    ["hdiutil", "verify", artifact.absolutePath],
    DISK_IMAGE_TIMEOUT_MS,
  );
  return {
    details:
      commandResult.exitCode === 0
        ? "hdiutil verify passed"
        : commandResult.timedOut
          ? "hdiutil verify timed out"
          : commandResult.stderr || commandResult.stdout || `exitCode=${commandResult.exitCode}`,
    label: `artifact:${artifact.relativePath}`,
    ok: commandResult.exitCode === 0,
  };
};

const verifyMagicArtifact = async (
  artifact: ReleaseArtifact,
  signature: Uint8Array,
  offset = 0,
): Promise<VerificationResult> => {
  const prefix = await readFilePrefix(artifact.absolutePath, offset + signature.length);
  return {
    details: bytesStartWith(prefix, signature, offset)
      ? `${artifact.kind} signature verified`
      : `${artifact.kind} signature mismatch`,
    label: `artifact:${artifact.relativePath}`,
    ok: bytesStartWith(prefix, signature, offset),
  };
};

const verifyArtifactType = async (artifact: ReleaseArtifact): Promise<VerificationResult> => {
  if (!(await pathExists(artifact.absolutePath))) {
    return {
      details: "artifact is missing",
      label: `artifact:${artifact.relativePath}`,
      ok: false,
    };
  }

  if (artifact.kind === "dmg") {
    return verifyDmgArtifact(artifact);
  }

  if (artifact.kind === "appimage") {
    const elfPrefix = await readFilePrefix(artifact.absolutePath, 11);
    const ok =
      bytesStartWith(elfPrefix, Uint8Array.from([127, 69, 76, 70])) &&
      bytesStartWith(elfPrefix, APPIMAGE_SIGNATURE, 8);
    return {
      details: ok ? "AppImage ELF and AI\\x02 signature verified" : "AppImage header mismatch",
      label: `artifact:${artifact.relativePath}`,
      ok,
    };
  }

  if (artifact.kind === "deb") {
    return verifyMagicArtifact(artifact, DEB_SIGNATURE);
  }

  if (artifact.kind === "rpm") {
    return verifyMagicArtifact(artifact, RPM_SIGNATURE);
  }

  if (artifact.kind === "portable") {
    return verifyMagicArtifact(artifact, ZIP_SIGNATURE);
  }

  return verifyMagicArtifact(artifact, WINDOWS_EXE_SIGNATURE);
};

const verifyArtifactPresence = async (artifact: ReleaseArtifact): Promise<VerificationResult> => {
  if (!(await pathExists(artifact.absolutePath))) {
    return {
      details: "missing",
      label: `artifact:present:${artifact.relativePath}`,
      ok: false,
    };
  }

  const artifactStats = await stat(artifact.absolutePath);
  return {
    details: `${artifactStats.size} bytes`,
    label: `artifact:present:${artifact.relativePath}`,
    ok: artifactStats.isFile() && artifactStats.size > 0,
  };
};

const verifyStagedDirectory = async (
  metadata: DesktopBundleMetadata,
  target: DesktopReleaseTarget,
): Promise<VerificationResult> => {
  const directoryPath = join(DESKTOP_RELEASE_ROOT, target);
  if (!(await pathExists(directoryPath))) {
    return {
      details: `missing ${directoryPath}`,
      label: `staging:${target}`,
      ok: false,
    };
  }

  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  const expectedArtifacts = buildArtifactsForTarget(metadata, target).map((artifact) =>
    basename(artifact.relativePath),
  );
  const actualArtifacts = directoryEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((entryName) => entryName.includes(metadata.productName));
  const unexpectedArtifacts = actualArtifacts.filter(
    (entryName) => !expectedArtifacts.includes(entryName),
  );
  const missingArtifacts = expectedArtifacts.filter(
    (entryName) => !actualArtifacts.includes(entryName),
  );

  return {
    details:
      missingArtifacts.length === 0 && unexpectedArtifacts.length === 0
        ? actualArtifacts.sort().join(", ")
        : `missing=[${missingArtifacts.join(", ")}] unexpected=[${unexpectedArtifacts.join(", ")}]`,
    label: `staging:${target}`,
    ok: missingArtifacts.length === 0 && unexpectedArtifacts.length === 0,
  };
};

const readChecksumEntries = async (): Promise<Map<string, string>> => {
  const checksumText = await Bun.file(DESKTOP_RELEASE_CHECKSUM_PATH).text();
  const entries = new Map<string, string>();
  const lines = checksumText
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  for (const line of lines) {
    const match = line.match(SHA256_ENTRY_PATTERN);
    if (!match) {
      throw new Error(`Invalid checksum manifest line: ${line}`);
    }

    const [, hash, relativePath] = match;
    entries.set(relativePath, hash);
  }

  return entries;
};

const verifyChecksumManifest = async (
  artifacts: readonly ReleaseArtifact[],
  targets: readonly DesktopReleaseTarget[],
): Promise<VerificationResult> => {
  const checksumEntries = await readChecksumEntries();
  const selectedTargetPrefixes = new Set(targets.map((target) => `${target}/`));
  const expectedPaths = new Set(artifacts.map((artifact) => artifact.relativePath));
  const actualPaths = Array.from(checksumEntries.keys())
    .filter((relativePath) =>
      Array.from(selectedTargetPrefixes).some((prefix) => relativePath.startsWith(prefix)),
    )
    .sort();
  const missingEntries = Array.from(expectedPaths)
    .filter((relativePath) => !checksumEntries.has(relativePath))
    .sort();
  const unexpectedEntries = actualPaths.filter((relativePath) => !expectedPaths.has(relativePath));

  return {
    details:
      missingEntries.length === 0 && unexpectedEntries.length === 0
        ? actualPaths.join(", ")
        : `missing=[${missingEntries.join(", ")}] unexpected=[${unexpectedEntries.join(", ")}]`,
    label: "checksum:manifest",
    ok: missingEntries.length === 0 && unexpectedEntries.length === 0,
  };
};

const verifyChecksumEntries = async (
  artifacts: readonly ReleaseArtifact[],
): Promise<readonly VerificationResult[]> => {
  const checksumEntries = await readChecksumEntries();
  return Promise.all(
    artifacts.map(async (artifact) => {
      if (!(await pathExists(artifact.absolutePath))) {
        return toVerificationResult(
          artifact.relativePath,
          checksumEntries.get(artifact.relativePath),
          "missing",
        );
      }
      const expectedHash = checksumEntries.get(artifact.relativePath);
      const actualHash = await computeSha256(artifact.absolutePath);
      return toVerificationResult(artifact.relativePath, expectedHash, actualHash);
    }),
  );
};

const verifyIconAssets = async (): Promise<readonly VerificationResult[]> => [
  ...(await Promise.all(
    DESKTOP_REQUIRED_PNG_ICON_SPECS.map((iconSpec) =>
      verifyPngIcon(iconSpec.relativePath, iconSpec.width, iconSpec.height),
    ),
  )),
  await verifyIcnsIcon(),
  await verifyIcoIcon(),
];

const verifySemver = (metadata: DesktopBundleMetadata): VerificationResult => ({
  details: metadata.version,
  label: "config:version-format",
  ok: SEMVER_PATTERN.test(metadata.version),
});

const verifyWindowsNsisPayload = async (): Promise<readonly VerificationResult[]> => {
  if (!(await pathExists(DESKTOP_WINDOWS_NSIS_SCRIPT_PATH))) {
    return [
      {
        details: `missing ${DESKTOP_WINDOWS_NSIS_SCRIPT_PATH}`,
        label: "windows:nsis-script",
        ok: false,
      },
    ] as const;
  }

  const installerScript = await Bun.file(DESKTOP_WINDOWS_NSIS_SCRIPT_PATH).text();
  const requiredMarkers = [
    '"/oname=gen\\runtime\\manifest.json"',
    '"/oname=gen\\runtime\\bin\\bao-bun-runner.exe"',
    WINDOWS_NSIS_WEBVIEW_BOOTSTRAPPER_MARKER,
    '"/oname=gen\\runtime\\server\\bao-desktop-server.exe"',
    WINDOWS_NSIS_SCRAPER_INSTALL_MARKER,
  ] as const;
  const missingMarkers = requiredMarkers.filter((marker) => !installerScript.includes(marker));

  return [
    {
      details: DESKTOP_WINDOWS_NSIS_SCRIPT_PATH,
      label: "windows:nsis-script",
      ok: true,
    },
    {
      details:
        missingMarkers.length === 0
          ? "installer bundles manifest, runner, server, and scraper runtime"
          : `missing ${missingMarkers.join(", ")}`,
      label: "windows:nsis-runtime-payload",
      ok: missingMarkers.length === 0,
    },
  ] as const;
};

const MACOS_ONLY_PACKAGES = new Set(["fsevents"]);

const verifyWindowsPortablePayload = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  const portableRoot = `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-portable`;
  const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(
    join(REPO_ROOT, "packages", "scraper"),
  );
  const requiredEntries = [
    `${portableRoot}/README.txt`,
    `${portableRoot}/${metadata.binaryName}.exe`,
    `${portableRoot}/gen/runtime/manifest.json`,
    `${portableRoot}/gen/runtime/bin/${DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_FILENAME}`,
    `${portableRoot}/gen/runtime/${DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH}.exe`,
    `${portableRoot}/gen/runtime/${DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH}.exe`,
    `${portableRoot}/gen/runtime/${DESKTOP_RUNTIME_SCRAPER_DIR}/package.json`,
    ...Array.from(runtimeDependencyRoots.keys())
      .filter((packageName) => !MACOS_ONLY_PACKAGES.has(packageName))
      .map((packageName) =>
        `${portableRoot}/gen/runtime/${DESKTOP_RUNTIME_SCRAPER_DIR}/node_modules/${packageName}/package.json`,
      ),
  ] as const;

  const zipEntriesResult = await captureResult(() => listZipEntries(artifact.absolutePath));
  if (!zipEntriesResult.ok) {
    return [
      {
        details: toErrorMessage(zipEntriesResult.error),
        label: "windows:portable-archive",
        ok: false,
      },
    ] as const;
  }

  const missingEntries = requiredEntries.filter(
    (entry) => !zipEntriesResult.value.includes(entry),
  );

  return [
    {
      details: artifact.relativePath,
      label: "windows:portable-archive",
      ok: true,
    },
    {
      details:
        missingEntries.length === 0
          ? "portable archive bundles executable, runtime, bootstrapper, and scraper payload"
          : `missing ${missingEntries.join(", ")}`,
      label: "windows:portable-payload",
      ok: missingEntries.length === 0,
    },
  ] as const;
};

type MountedDmgResult =
  | { readonly ok: true; readonly mountRoot: string }
  | { readonly ok: false; readonly failure: VerificationResult };

const attachDmgArtifact = async (artifact: ReleaseArtifact): Promise<MountedDmgResult> => {
  const mountRoot = await mkdtemp(join(tmpdir(), "bao-desktop-dmg-"));
  const attachResult = await captureCommand(
    [
      "hdiutil",
      "attach",
      "-readonly",
      "-nobrowse",
      "-mountpoint",
      mountRoot,
      artifact.absolutePath,
    ],
    DISK_IMAGE_TIMEOUT_MS,
  );
  if (attachResult.exitCode === 0) {
    return { mountRoot, ok: true };
  }

  await rm(mountRoot, { force: true, recursive: true });
  return {
    failure: {
      details:
        attachResult.timedOut
          ? "hdiutil attach timed out"
          : attachResult.stderr || attachResult.stdout || `exitCode=${attachResult.exitCode}`,
      label: "macos:dmg-mount",
      ok: false,
    },
    ok: false,
  };
};

const detachDmgArtifact = async (mountRoot: string): Promise<VerificationResult> => {
  const detachResult = await captureCommand(
    ["hdiutil", "detach", mountRoot, "-force"],
    DISK_IMAGE_TIMEOUT_MS,
  );
  await rm(mountRoot, { force: true, recursive: true });

  return {
    details:
      detachResult.exitCode === 0
        ? mountRoot
        : detachResult.stderr || detachResult.stdout || `exitCode=${detachResult.exitCode}`,
    label: "macos:dmg-detach",
    ok: detachResult.exitCode === 0,
  };
};

const verifyMountedDmgPayload = async (
  mountRoot: string,
  metadata: DesktopBundleMetadata,
): Promise<VerificationResult> => {
  const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(
    join(REPO_ROOT, "packages", "scraper"),
  );
  const requiredEntries = buildRuntimePackageEntries(
    "macos",
    metadata,
    Array.from(runtimeDependencyRoots.keys()),
  );
  const mountedEntriesResult = await captureResult(() => collectRelativeEntries(mountRoot));
  if (!mountedEntriesResult.ok) {
    return {
      details: toErrorMessage(mountedEntriesResult.error),
      label: "macos:dmg-payload",
      ok: false,
    };
  }

  const mountedEntries = new Set(mountedEntriesResult.value.map(normalizeArchiveEntry));
  const missingEntries = requiredEntries.filter((entry) => !mountedEntries.has(entry));

  return {
    details:
      missingEntries.length === 0
        ? "dmg bundles desktop binary, runtime manifest, runner, server, scraper, and dependencies"
        : `missing ${missingEntries.join(", ")}`,
    label: "macos:dmg-payload",
    ok: missingEntries.length === 0,
  };
};

const verifyMacosDmgPayload = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  const mountResult = await attachDmgArtifact(artifact);
  if (!mountResult.ok) {
    return [mountResult.failure] as const;
  }

  const payloadResult = await verifyMountedDmgPayload(mountResult.mountRoot, metadata);
  const detachResult = await detachDmgArtifact(mountResult.mountRoot);

  return [
    {
      details: artifact.relativePath,
      label: "macos:dmg-mount",
      ok: true,
    },
    payloadResult,
    detachResult,
  ] as const;
};

const listDebEntries = async (absolutePath: string): Promise<readonly string[]> => {
  const commandResult = await captureCommand(["dpkg-deb", "-c", absolutePath], ZIP_LIST_TIMEOUT_MS);
  if (commandResult.exitCode !== 0) {
    throw new Error(commandResult.stderr || commandResult.stdout || `exitCode=${commandResult.exitCode}`);
  }

  return commandResult.stdout
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => normalizeArchiveEntry(line.split(WHITESPACE_PATTERN).at(-1) ?? ""))
    .filter((entry) => entry.length > 0);
};

const listRpmEntries = async (absolutePath: string): Promise<readonly string[]> => {
  const commandResult = await captureCommand(
    ["rpm", "--query", "--list", "--package", absolutePath],
    ZIP_LIST_TIMEOUT_MS,
  );
  if (commandResult.exitCode !== 0) {
    throw new Error(commandResult.stderr || commandResult.stdout || `exitCode=${commandResult.exitCode}`);
  }

  return commandResult.stdout
    .split(/\r?\n/gu)
    .map((entry) => normalizeArchiveEntry(entry))
    .filter((entry) => entry.length > 0);
};

const verifyLinuxPackagePayload = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  if (!(artifact.target === "linux-x64" || artifact.target === "linux-arm64")) {
    return [] as const;
  }

  const missingToolResult =
    artifact.kind === "deb"
      ? requireCommand(`linux ${artifact.kind} verification`, "dpkg-deb")
      : requireCommand(`linux ${artifact.kind} verification`, "rpm");
  if (missingToolResult) {
    return [missingToolResult] as const;
  }

  const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(
    join(REPO_ROOT, "packages", "scraper"),
  );
  const requiredEntries = buildRuntimePackageEntries(
    artifact.target,
    metadata,
    Array.from(runtimeDependencyRoots.keys()),
  );
  const entriesResult = await captureResult(() =>
    artifact.kind === "deb"
      ? listDebEntries(artifact.absolutePath)
      : listRpmEntries(artifact.absolutePath),
  );
  if (!entriesResult.ok) {
    return [
      {
        details: toErrorMessage(entriesResult.error),
        label: `linux:${artifact.kind}-archive:${artifact.target}`,
        ok: false,
      },
    ] as const;
  }

  const archiveEntries = new Set(entriesResult.value.map(normalizeArchiveEntry));
  const missingEntries = requiredEntries.filter((entry) => !archiveEntries.has(entry));

  return [
    {
      details: artifact.relativePath,
      label: `linux:${artifact.kind}-archive:${artifact.target}`,
      ok: true,
    },
    {
      details:
        missingEntries.length === 0
          ? `${artifact.kind} bundles desktop binary, runtime manifest, runner, server, scraper, and dependencies`
          : `missing ${missingEntries.join(", ")}`,
      label: `linux:${artifact.kind}-payload:${artifact.target}`,
      ok: missingEntries.length === 0,
    },
  ] as const;
};

const writeResults = async (results: readonly VerificationResult[]): Promise<void> => {
  await writeOutput(
    results
      .map((result) => `[${result.ok ? "ok" : "fail"}] ${result.label} ${result.details}`)
      .join("\n"),
  );
};

const toVerificationResult = (
  relativePath: string,
  expectedHash: string | undefined,
  actualHash: string,
): VerificationResult => ({
  details:
    expectedHash === actualHash
      ? actualHash
      : `checksum mismatch expected=${expectedHash ?? "missing"} actual=${actualHash}`,
  label: `checksum:${relativePath}`,
  ok: expectedHash === actualHash,
});

const main = async (): Promise<void> => {
  const targets = parseCommandTargets(process.argv.slice(2));
  const metadata = await readDesktopMetadata();
  const artifacts = collectExpectedArtifacts(metadata, targets);
  const windowsPortableArtifact =
    targets.includes("windows")
      ? artifacts.find((artifact) => artifact.target === "windows" && artifact.kind === "portable")
      : undefined;

  const results = [
    verifySemver(metadata),
    ...verifyBundleConfig(metadata, targets),
    ...(await verifyReleaseProvenance(metadata, targets)),
    ...(await verifyIconAssets()),
    ...(await Promise.all(targets.map((target) => verifyStagedDirectory(metadata, target)))),
    ...(targets.includes("windows") ? await verifyWindowsNsisPayload() : []),
    ...(windowsPortableArtifact
      ? await verifyWindowsPortablePayload(windowsPortableArtifact, metadata)
      : []),
    ...(
      await Promise.all(
        artifacts.map(async (artifact) => {
          if (artifact.kind === "dmg") {
            return verifyMacosDmgPayload(artifact, metadata);
          }
          if (artifact.kind === "deb" || artifact.kind === "rpm") {
            return verifyLinuxPackagePayload(artifact, metadata);
          }
          return [] as const;
        }),
      )
    ).flat(),
    ...(await Promise.all(
      artifacts.flatMap((artifact) => [
        verifyArtifactPresence(artifact),
        verifyArtifactType(artifact),
      ]),
    )),
    await verifyChecksumManifest(artifacts, targets),
    ...(await verifyChecksumEntries(artifacts)),
  ];

  await writeOutput(
    `desktop-release:verify targets=${targets.join(",")} product=${metadata.productName} version=${metadata.version} binary=${metadata.binaryName}`,
  );
  await writeResults(results);

  if (results.some((result) => !result.ok)) {
    await writeError("desktop-release:verify failed.");
    process.exit(1);
  }

  await writeOutput("desktop-release:verify passed.");
};

await main().catch(async (error: unknown) => {
  await writeError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
