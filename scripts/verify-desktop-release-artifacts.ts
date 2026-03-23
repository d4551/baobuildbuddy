import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_REQUIRED_NATIVE_ICON_FILES,
  DESKTOP_REQUIRED_PNG_ICON_SPECS,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DISK_IMAGE_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";
import {
  buildDesktopReleaseArtifactFileNames,
  buildDesktopReleaseArtifactSpecs,
  DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
  type DesktopReleaseArtifactKind,
  type DesktopReleaseArtifactProfile,
  type DesktopReleaseMacosArchitecture,
  normalizeDesktopReleaseArtifactProfile,
} from "../packages/shared/src/utils/desktop-release-contract";
import {
  buildDesktopRuntimeManifest,
  type DesktopRuntimeManifest,
  getDesktopRuntimeManifestMismatches,
  listDesktopRuntimeContractPaths,
  parseDesktopRuntimeManifest,
  resolveDesktopRuntimeTargetInfo,
} from "../packages/shared/src/utils/desktop-runtime-contract";
import { captureResult, toErrorMessage, withCleanup } from "./utils/async-control";
import { writeError, writeOutput } from "./utils/cli-output";
import {
  hasNativeDesktopReleaseProvenance,
  isDesktopReleaseProvenance,
} from "./utils/desktop-release-refresh";
import { orderTargetsPresentInProvenance } from "./utils/desktop-release-verify-targets";
import { collectRuntimeDependencySourceRoots } from "./utils/desktop-runtime-scraper";

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

type ReleaseArtifactKind = DesktopReleaseArtifactKind | "appimage";

type ReleaseArtifact = {
  readonly kind: ReleaseArtifactKind;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly target: DesktopReleaseTarget;
};

type LinuxReleaseArtifact = ReleaseArtifact & {
  readonly kind: "deb" | "rpm";
  readonly target: "linux-x64" | "linux-arm64";
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
const DEFAULT_DESKTOP_RELEASE_ROOT = join(DESKTOP_ROOT, "releases");
const DESKTOP_TAURI_ROOT = join(DESKTOP_ROOT, "src-tauri");
const DESKTOP_ICON_ROOT = join(DESKTOP_TAURI_ROOT, "icons");
const DESKTOP_PACKAGE_JSON_PATH = join(DESKTOP_ROOT, "package.json");
const DESKTOP_TAURI_CONFIG_PATH = join(DESKTOP_TAURI_ROOT, "tauri.conf.json");
const DESKTOP_CARGO_TOML_PATH = join(DESKTOP_TAURI_ROOT, "Cargo.toml");
const RELEASE_ROOT_FLAG = "--release-root";

/** Parsed once in `main()` via `parseReleaseRoot`. All path helpers reference this. */
let DESKTOP_RELEASE_ROOT = DEFAULT_DESKTOP_RELEASE_ROOT;
let DESKTOP_RELEASE_CHECKSUM_PATH = join(DESKTOP_RELEASE_ROOT, "sha256.txt");
let DESKTOP_RELEASE_PROVENANCE_PATH = join(
  DESKTOP_RELEASE_ROOT,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
);
let DESKTOP_RELEASE_METADATA_ROOT = join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_METADATA_DIR);

/** Resolves `--release-root <path>` from argv, falling back to the canonical `packages/desktop/releases`. */
const parseReleaseRoot = (argv: readonly string[]): string => {
  const flagIndex = argv.indexOf(RELEASE_ROOT_FLAG);
  if (flagIndex === -1 || !argv[flagIndex + 1]) {
    return DEFAULT_DESKTOP_RELEASE_ROOT;
  }
  return resolve(REPO_ROOT, argv[flagIndex + 1]);
};

/** Call once before any verification to redirect all path helpers. */
const applyReleaseRoot = (releaseRoot: string): void => {
  DESKTOP_RELEASE_ROOT = releaseRoot;
  DESKTOP_RELEASE_CHECKSUM_PATH = join(releaseRoot, "sha256.txt");
  DESKTOP_RELEASE_PROVENANCE_PATH = join(releaseRoot, DESKTOP_RELEASE_PROVENANCE_FILENAME);
  DESKTOP_RELEASE_METADATA_ROOT = join(releaseRoot, DESKTOP_RELEASE_METADATA_DIR);
  DESKTOP_WINDOWS_NSIS_SCRIPT_PATH = join(
    DESKTOP_RELEASE_METADATA_ROOT,
    "windows",
    "installer.nsi",
  );
};
let DESKTOP_WINDOWS_NSIS_SCRIPT_PATH = join(
  DESKTOP_RELEASE_METADATA_ROOT,
  "windows",
  "installer.nsi",
);
const WINDOWS_RUNTIME_MANIFEST = buildDesktopRuntimeManifest("windows");
const WINDOWS_NSIS_SCRAPER_INSTALL_MARKER = [
  "$INSTDIR",
  "gen",
  "runtime",
  WINDOWS_RUNTIME_MANIFEST.scraperDir,
].join("\\");
const LINUX_APPIMAGE_ENV = "DESKTOP_RELEASE_LINUX_APPIMAGE";
const LINUX_SIGNING_ENV = "DESKTOP_RELEASE_LINUX_SIGNATURES";
const WINDOWS_MSI_ENV = "DESKTOP_RELEASE_WINDOWS_MSI";
const MACOS_ARCH_ENV = "DESKTOP_RELEASE_MACOS_ARCHITECTURES";
const RELEASE_BUILD_ENV = "DESKTOP_RELEASE_RELEASE_MODE";
const SKIP_MACOS_STAPLER_ENV = "DESKTOP_RELEASE_SKIP_MACOS_STAPLER";
const LINUX_APPIMAGE_FLAG = "--include-linux-appimage";
const LINUX_SIGNING_FLAG = "--include-linux-signatures";
const WINDOWS_MSI_FLAG = "--include-windows-msi";
const MACOS_ARCH_FLAG = "--macos-architectures";
const RELEASE_FLAG = "--release";
const GPG_SIG_PREFIX = "-----BEGIN PGP SIGNATURE";
const WINDOWS_SIGNING_TOOL = "signtool";
const WINDOWS_CERTIFICATE_ENV = "WINDOWS_CERTIFICATE";
const SIGCHECK_MIN_SIZE_BYTES = 128;

const GIT_LFS_POINTER_PREFIX = "version https://git-lfs.github.com/spec/v1";

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_SIGNATURE = Uint8Array.from([0, 0, 1, 0]);
const ICNS_SIGNATURE = Uint8Array.from([105, 99, 110, 115]);
const APPIMAGE_SIGNATURE = Uint8Array.from([65, 73, 2]);
const DEB_SIGNATURE = Uint8Array.from([33, 60, 97, 114, 99, 104, 62, 10]);
const RPM_SIGNATURE = Uint8Array.from([237, 171, 238, 219]);
const ZIP_SIGNATURE = Uint8Array.from([80, 75, 3, 4]);
const WINDOWS_EXE_SIGNATURE = Uint8Array.from([77, 90]);
const ZIP_LIST_TIMEOUT_MS = 30_000;
const REQUIRED_ICO_LAYER_SIZES = [16, 24, 32, 48, 64, 256] as const;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u;
const SHA256_ENTRY_PATTERN = /^([a-f0-9]{64}) {2}(.+)$/u;
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const CARGO_PACKAGE_NAME_PATTERN = /^name = "([^"]+)"/m;
const LEADING_DOT_SLASH_PATTERN = /^\.\/+/u;
const LEADING_SLASH_PATTERN = /^\/+/u;
const ZIP_EXTENSION_PATTERN = /\.zip$/u;

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

const requireCommand = (label: string, command: string): VerificationResult | null => {
  if (Bun.which(command)) {
    return null;
  }

  return {
    details: `${command} is required on PATH for ${label}`,
    label: `tool:${command}`,
    ok: false,
  };
};

const isGitLfsPointerFileContent = (bytes: Uint8Array): boolean => {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return text.trimStart().startsWith(GIT_LFS_POINTER_PREFIX);
};

const parseExplicitVerificationTargets = (
  argv: readonly string[],
): readonly DesktopReleaseTarget[] | null => {
  const targetsIndex = argv.indexOf("--targets");
  if (targetsIndex === -1) {
    return null;
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

const resolveVerificationTargets = async (
  argv: readonly string[],
): Promise<readonly DesktopReleaseTarget[]> => {
  const explicitTargets = parseExplicitVerificationTargets(argv);
  if (explicitTargets !== null) {
    return explicitTargets;
  }

  const provenanceTargetsResult = await captureResult(async () => {
    const provenanceEntries = await readReleaseProvenance();
    const selected = orderTargetsPresentInProvenance(new Set(provenanceEntries.keys()));
    if (selected.length === 0) {
      throw new Error("Assembled release provenance did not list any supported targets.");
    }
    return selected;
  });

  if (provenanceTargetsResult.ok) {
    return provenanceTargetsResult.value;
  }

  return DESKTOP_RELEASE_TARGETS;
};

const parseBooleanValue = (value: string | undefined): boolean =>
  value?.trim().toLowerCase() === "1" ||
  value?.trim().toLowerCase() === "true" ||
  value?.trim().toLowerCase() === "yes" ||
  value?.trim().toLowerCase() === "on";

/** When unset or empty, callers should apply `DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE` for that toggle. */
const parseOptionalEnvBoolean = (environmentKey: string): boolean | undefined => {
  const raw = process.env[environmentKey]?.trim();
  if (raw === undefined || raw === "") {
    return;
  }
  return parseBooleanValue(raw);
};

const parseMacosArchitecture = (rawArchitecture: string): DesktopReleaseMacosArchitecture => {
  if (
    rawArchitecture === "aarch64" ||
    rawArchitecture === "x86_64" ||
    rawArchitecture === "universal"
  ) {
    return rawArchitecture;
  }

  throw new Error(`Unsupported macOS architecture token: ${rawArchitecture}`);
};

const parseMacosArchitecturesFromInput = (
  rawValue: string,
): readonly DesktopReleaseMacosArchitecture[] => {
  const values = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (values.length === 0) {
    return DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.macosArchitectures;
  }

  return values.map((value) => parseMacosArchitecture(value));
};

const parseReleaseProfile = (argv: readonly string[]): DesktopReleaseArtifactProfile => {
  const macosArchitecturesArgIndex = argv.indexOf(MACOS_ARCH_FLAG);
  const macosArchitecturesValue =
    macosArchitecturesArgIndex === -1
      ? process.env[MACOS_ARCH_ENV]
      : argv[macosArchitecturesArgIndex + 1];
  return normalizeDesktopReleaseArtifactProfile({
    includeLinuxAppImage:
      argv.includes(LINUX_APPIMAGE_FLAG) ||
      (parseOptionalEnvBoolean(LINUX_APPIMAGE_ENV) ??
        DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.includeLinuxAppImage),
    includeLinuxSignatures:
      argv.includes(LINUX_SIGNING_FLAG) ||
      (parseOptionalEnvBoolean(LINUX_SIGNING_ENV) ??
        DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.includeLinuxSignatures),
    includeWindowsMsi:
      argv.includes(WINDOWS_MSI_FLAG) ||
      (parseOptionalEnvBoolean(WINDOWS_MSI_ENV) ??
        DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.includeWindowsMsi),
    macosArchitectures:
      macosArchitecturesValue === undefined
        ? DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.macosArchitectures
        : parseMacosArchitecturesFromInput(macosArchitecturesValue),
  });
};

const isReleaseMode = (argv: readonly string[]): boolean =>
  argv.includes(RELEASE_FLAG) || parseBooleanValue(process.env[RELEASE_BUILD_ENV]);

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

const readReleaseProvenance = async (): Promise<
  ReadonlyMap<DesktopReleaseTarget, ReleaseProvenance>
> => {
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

const buildArtifactsForTarget = (
  metadata: DesktopBundleMetadata,
  target: DesktopReleaseTarget,
  profile: DesktopReleaseArtifactProfile,
): readonly ReleaseArtifact[] => {
  return buildDesktopReleaseArtifactSpecs(metadata, target, profile).map((artifact) =>
    createReleaseArtifact(target, artifact.relativePath, artifact.kind),
  );
};

const collectExpectedArtifacts = (
  metadata: DesktopBundleMetadata,
  targets: readonly DesktopReleaseTarget[],
  profile: DesktopReleaseArtifactProfile,
): readonly ReleaseArtifact[] =>
  targets.flatMap((target) => buildArtifactsForTarget(metadata, target, profile));

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
        ["deb", "dmg", "nsis", "rpm"].every((target) => metadata.tauriTargets.includes(target))),
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
  resolveDesktopRuntimeTargetInfo(target).hostPlatform;

const expectedHostArchForTarget = (target: DesktopReleaseTarget): string =>
  resolveDesktopRuntimeTargetInfo(target).hostArch;

const expectedTauriTargetForTarget = (target: DesktopReleaseTarget): string =>
  resolveDesktopRuntimeTargetInfo(target).tauriTarget;

const normalizeArchiveEntry = (entry: string): string =>
  entry.trim().replace(LEADING_DOT_SLASH_PATTERN, "").replace(LEADING_SLASH_PATTERN, "");

const joinArchiveEntry = (...segments: readonly string[]): string =>
  normalizeArchiveEntry(segments.filter((segment) => segment.length > 0).join("/"));

const buildRuntimeContractEntries = (
  runtimeRoot: string,
  manifest: DesktopRuntimeManifest,
  dependencyPackageNames: readonly string[],
): readonly string[] =>
  listDesktopRuntimeContractPaths(manifest, dependencyPackageNames).map((relativePath) =>
    joinArchiveEntry(runtimeRoot, relativePath),
  );

const MACOS_ONLY_PACKAGES = new Set(["fsevents"]);

const quoteShellArgument = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

const filterRuntimeDependencyPackageNames = (
  target: DesktopReleaseTarget,
  dependencyPackageNames: readonly string[],
): readonly string[] =>
  target === "macos"
    ? dependencyPackageNames
    : dependencyPackageNames.filter((packageName) => !MACOS_ONLY_PACKAGES.has(packageName));

const collectRuntimeDependencyPackageNames = async (
  target: DesktopReleaseTarget,
): Promise<readonly string[]> => {
  const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(
    join(REPO_ROOT, "packages", "scraper"),
  );
  return filterRuntimeDependencyPackageNames(target, Array.from(runtimeDependencyRoots.keys()));
};

const readDesktopRuntimeManifestFile = async (
  absolutePath: string,
): Promise<DesktopRuntimeManifest> =>
  parseDesktopRuntimeManifest(JSON.parse(await Bun.file(absolutePath).text()), absolutePath);

const verifyDesktopRuntimeManifest = (
  target: DesktopReleaseTarget,
  manifest: DesktopRuntimeManifest,
  label: string,
): VerificationResult => {
  const expectedManifest = buildDesktopRuntimeManifest(target);
  const manifestMismatches = getDesktopRuntimeManifestMismatches(manifest, expectedManifest);

  return {
    details:
      manifestMismatches.length === 0
        ? "manifest matches canonical runtime contract"
        : manifestMismatches.join("; "),
    label,
    ok: manifestMismatches.length === 0,
  };
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

const verifyCollectedEntries = async (
  rootPath: string,
  requiredEntries: readonly string[],
  label: string,
  successDetails: string,
): Promise<VerificationResult> => {
  const collectedEntriesResult = await captureResult(() => collectRelativeEntries(rootPath));
  if (!collectedEntriesResult.ok) {
    return {
      details: toErrorMessage(collectedEntriesResult.error),
      label,
      ok: false,
    };
  }

  const collectedEntries = new Set(collectedEntriesResult.value.map(normalizeArchiveEntry));
  const missingEntries = requiredEntries.filter((entry) => !collectedEntries.has(entry));

  return {
    details: missingEntries.length === 0 ? successDetails : `missing ${missingEntries.join(", ")}`,
    label,
    ok: missingEntries.length === 0,
  };
};

const verifyReleaseProvenance = async (
  metadata: DesktopBundleMetadata,
  targets: readonly DesktopReleaseTarget[],
  profile: DesktopReleaseArtifactProfile,
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
      ? provenance.artifactNames.filter(
          (artifactName): artifactName is string => typeof artifactName === "string",
        )
      : [];
    const expectedArtifactNames = buildArtifactsForTarget(metadata, target, profile)
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
      `buildMode=${hasNativeDesktopReleaseProvenance(provenance) ? "native" : "stage-only"}`,
    ].join(" ");

    return {
      details,
      label: `provenance:${target}`,
      ok:
        isDesktopReleaseProvenance(provenance) &&
        provenance.tauriCli === "repo-local-bun" &&
        provenance.hostPlatform === expectedHostPlatformForTarget(target) &&
        provenance.hostArch === expectedHostArchForTarget(target) &&
        provenance.tauriTarget === expectedTauriTargetForTarget(target) &&
        actualArtifactNames.length === expectedArtifactNames.length &&
        actualArtifactNames.every(
          (artifactName, index) => artifactName === expectedArtifactNames[index],
        ),
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
    const proc = Bun.spawn(command as string[], {
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

const quotePowershellLiteral = (value: string): string => value.replaceAll("'", "''");

const extractZipArchive = async (absolutePath: string, destinationRoot: string): Promise<void> => {
  const commandCandidates = [
    ["unzip", "-qq", absolutePath, "-d", destinationRoot],
    [
      "powershell",
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${quotePowershellLiteral(absolutePath)}' -DestinationPath '${quotePowershellLiteral(destinationRoot)}' -Force`,
    ],
    [
      "pwsh",
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${quotePowershellLiteral(absolutePath)}' -DestinationPath '${quotePowershellLiteral(destinationRoot)}' -Force`,
    ],
  ] as const;

  const commandResult = await commandCandidates.reduce<Promise<CommandCapture | null>>(
    async (pendingResult, command) => {
      const settledResult = await pendingResult;
      if (settledResult?.exitCode === 0) {
        return settledResult;
      }
      if (!Bun.which(command[0])) {
        return settledResult;
      }
      return captureCommand(command, ZIP_LIST_TIMEOUT_MS);
    },
    Promise.resolve(null),
  );

  if (!commandResult || commandResult.exitCode !== 0) {
    throw new Error(`Unable to extract zip archive ${absolutePath}.`);
  }
};

const extractDebPackage = async (absolutePath: string, destinationRoot: string): Promise<void> => {
  const commandResult = await captureCommand(
    ["dpkg-deb", "-x", absolutePath, destinationRoot],
    ZIP_LIST_TIMEOUT_MS,
  );
  if (commandResult.exitCode !== 0) {
    throw new Error(
      commandResult.stderr ||
        commandResult.stdout ||
        `Unable to extract deb package ${absolutePath}.`,
    );
  }
};

const extractRpmPackage = async (absolutePath: string, destinationRoot: string): Promise<void> => {
  const commandResult = await captureCommand(
    [
      "sh",
      "-lc",
      `cd ${quoteShellArgument(destinationRoot)} && rpm2cpio ${quoteShellArgument(absolutePath)} | cpio -idm --quiet`,
    ],
    ZIP_LIST_TIMEOUT_MS,
  );
  if (commandResult.exitCode !== 0) {
    throw new Error(
      commandResult.stderr ||
        commandResult.stdout ||
        `Unable to extract rpm package ${absolutePath}.`,
    );
  }
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
  const signatureOk = bytesStartWith(prefix, signature, offset);
  if (signatureOk) {
    return {
      details: `${artifact.kind} signature verified`,
      label: `artifact:${artifact.relativePath}`,
      ok: true,
    };
  }

  const lfsProbe = await readFilePrefix(artifact.absolutePath, 256);
  if (isGitLfsPointerFileContent(lfsProbe)) {
    return {
      details: "Git LFS pointer file; run git lfs pull in the repo root to fetch release binaries",
      label: `artifact:${artifact.relativePath}`,
      ok: false,
    };
  }

  return {
    details: `${artifact.kind} signature mismatch`,
    label: `artifact:${artifact.relativePath}`,
    ok: false,
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

  if (artifact.kind === "sig") {
    const prefix = await readFilePrefix(artifact.absolutePath, SIGCHECK_MIN_SIZE_BYTES);
    const signatureText = new TextDecoder().decode(prefix);
    return {
      details: signatureText.includes(GPG_SIG_PREFIX)
        ? "gpg signature header detected"
        : "gpg signature header missing",
      label: `artifact:${artifact.relativePath}`,
      ok: signatureText.includes(GPG_SIG_PREFIX),
    };
  }

  return verifyMagicArtifact(artifact, WINDOWS_EXE_SIGNATURE);
};

const verifyWindowsAuthenticode = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
  checkPortablePayload: boolean,
): Promise<readonly VerificationResult[]> => {
  if (artifact.kind !== "portable" && artifact.kind !== "setup" && artifact.kind !== "msi") {
    return [] as const;
  }

  if (!Bun.which(WINDOWS_SIGNING_TOOL)) {
    return [
      {
        details: `${WINDOWS_SIGNING_TOOL} is required on PATH for windows release verification`,
        label: `artifact:${artifact.relativePath}:signing`,
        ok: false,
      },
    ];
  }

  if (artifact.kind === "setup") {
    return [
      {
        ...(await verifyWindowsExecutableSignature(artifact)),
        label: `artifact:${artifact.relativePath}:authenticode`,
      },
    ];
  }

  if (artifact.kind === "msi") {
    return [await verifyWindowsExecutableSignature(artifact)];
  }

  if (!checkPortablePayload) {
    return [
      {
        details: "portable signature check skipped in non-release mode",
        label: `artifact:${artifact.relativePath}:authenticode`,
        ok: true,
      },
    ];
  }

  return verifyPortableExecutableSignatureInZip(artifact, metadata);
};

const verifyWindowsExecutableSignature = async (
  artifact: ReleaseArtifact,
): Promise<VerificationResult> => {
  const commandResult = await captureCommand(
    [WINDOWS_SIGNING_TOOL, "verify", "/pa", "/v", artifact.absolutePath],
    DISK_IMAGE_TIMEOUT_MS,
  );
  return {
    details:
      commandResult.exitCode === 0
        ? `authenticode verify passed (${artifact.kind})`
        : commandResult.timedOut
          ? "signtool verify timed out"
          : commandResult.stderr || commandResult.stdout || `exitCode=${commandResult.exitCode}`,
    label: `artifact:${artifact.relativePath}:authenticode`,
    ok: commandResult.exitCode === 0,
  };
};

const verifyPortableExecutableSignatureInZip = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  const zipRoot = await mkdtemp(join(tmpdir(), "bao-desktop-portable-verify-"));
  return withCleanup(
    async () => {
      const extractResult = await captureResult(() =>
        extractZipArchive(artifact.absolutePath, zipRoot),
      );
      if (!extractResult.ok) {
        return [
          {
            details: toErrorMessage(extractResult.error),
            label: `artifact:${artifact.relativePath}:portable-signature`,
            ok: false,
          },
        ];
      }

      const portableRootName = ZIP_EXTENSION_PATTERN.test(artifact.relativePath)
        ? artifact.relativePath.replace(ZIP_EXTENSION_PATTERN, "")
        : basename(artifact.relativePath).replace(".zip", "");
      const portableExecutable = join(zipRoot, portableRootName, `${metadata.binaryName}.exe`);
      if (!(await pathExists(portableExecutable))) {
        return [
          {
            details: `missing extracted portable exe for ${artifact.relativePath}`,
            label: `artifact:${artifact.relativePath}:portable-signature`,
            ok: false,
          },
        ];
      }

      const commandResult = await captureCommand(
        [WINDOWS_SIGNING_TOOL, "verify", "/pa", "/v", portableExecutable],
        DISK_IMAGE_TIMEOUT_MS,
      );
      return [
        {
          details:
            commandResult.exitCode === 0
              ? "portable executable is Authenticode-signed"
              : commandResult.timedOut
                ? "portable executable authenticode verification timed out"
                : commandResult.stderr ||
                  commandResult.stdout ||
                  `exitCode=${commandResult.exitCode}`,
          label: `artifact:${artifact.relativePath}:portable-signature`,
          ok: commandResult.exitCode === 0,
        },
      ];
    },
    () => rm(zipRoot, { force: true, recursive: true }),
  );
};

const verifyMacosNotaryTicket = async (artifact: ReleaseArtifact): Promise<VerificationResult> => {
  if (!(await pathExists(artifact.absolutePath))) {
    return {
      details: "artifact is missing",
      label: `artifact:${artifact.relativePath}:notarization`,
      ok: false,
    };
  }

  const missingTool = requireCommand("macOS notarization verification", "xcrun");
  if (missingTool) {
    return {
      ...missingTool,
      label: `artifact:${artifact.relativePath}:notarization`,
      details: `${missingTool.details} (notarization verification unavailable)`,
    };
  }

  const validateResult = await captureCommand(
    ["xcrun", "stapler", "validate", "-v", artifact.absolutePath],
    DISK_IMAGE_TIMEOUT_MS,
  );
  const staplerOutput = validateResult.timedOut
    ? "stapler validate timed out"
    : validateResult.stderr || validateResult.stdout || `exitCode=${validateResult.exitCode}`;
  const notStapledHint =
    "Not stapled: for repo/checkouts without a shipping DMG, run verify without --release; for release, notarize and staple the DMG (see packages/desktop/releases/README.md).";
  return {
    details:
      validateResult.exitCode === 0
        ? "stapler validate passed"
        : `${staplerOutput} | ${notStapledHint}`,
    label: `artifact:${artifact.relativePath}:notarization`,
    ok: validateResult.exitCode === 0,
  };
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
  profile: DesktopReleaseArtifactProfile,
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
  const expectedArtifacts = buildArtifactsForTarget(metadata, target, profile).map((artifact) =>
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
        details: "Tauri v2 deletes .nsi after makensis — ephemeral intermediate artifact",
        label: "windows:nsis-script",
        ok: true,
      },
    ] as const;
  }

  const installerScript = await Bun.file(DESKTOP_WINDOWS_NSIS_SCRIPT_PATH).text();
  const requiredManifestMarkers = listDesktopRuntimeContractPaths(WINDOWS_RUNTIME_MANIFEST, [])
    .filter(
      (relativePath) =>
        relativePath !== "manifest.json" &&
        relativePath !== `${WINDOWS_RUNTIME_MANIFEST.scraperDir}/package.json`,
    )
    .map((relativePath) => `"/oname=gen\\runtime\\${relativePath.replaceAll("/", "\\")}"`);
  const requiredMarkers = [
    '"/oname=gen\\runtime\\manifest.json"',
    ...requiredManifestMarkers,
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

type ManifestVerificationResult =
  | { readonly ok: true; readonly manifest: DesktopRuntimeManifest }
  | { readonly ok: false; readonly failure: VerificationResult };

const hasVerifiedManifest = (
  manifestResult: ManifestVerificationResult,
): manifestResult is { readonly ok: true; readonly manifest: DesktopRuntimeManifest } =>
  manifestResult.ok;

const isLinuxPackageArtifact = (artifact: ReleaseArtifact): artifact is LinuxReleaseArtifact =>
  (artifact.target === "linux-x64" || artifact.target === "linux-arm64") &&
  (artifact.kind === "deb" || artifact.kind === "rpm");

const readRuntimeManifestForVerification = async (
  manifestPath: string,
  label: string,
): Promise<ManifestVerificationResult> => {
  const manifestResult = await captureResult(() => readDesktopRuntimeManifestFile(manifestPath));
  if (!manifestResult.ok) {
    return {
      failure: {
        details: toErrorMessage(manifestResult.error),
        label,
        ok: false,
      },
      ok: false,
    };
  }

  return {
    manifest: manifestResult.value,
    ok: true,
  };
};

const verifyExtractedWindowsPortablePayload = async (
  extractionRoot: string,
  portableRoot: string,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  const runtimeRoot = join(extractionRoot, portableRoot, "gen", "runtime");
  const manifestResult = await readRuntimeManifestForVerification(
    join(runtimeRoot, "manifest.json"),
    "windows:portable-manifest",
  );
  if (!hasVerifiedManifest(manifestResult)) {
    return [manifestResult.failure] as const;
  }

  const dependencyPackageNames = await collectRuntimeDependencyPackageNames("windows");
  const requiredEntries = [
    `${portableRoot}/README.txt`,
    `${portableRoot}/${metadata.binaryName}.exe`,
    ...buildRuntimeContractEntries(
      `${portableRoot}/gen/runtime`,
      manifestResult.manifest,
      dependencyPackageNames,
    ),
  ] as const;

  return [
    verifyDesktopRuntimeManifest("windows", manifestResult.manifest, "windows:portable-manifest"),
    await verifyCollectedEntries(
      extractionRoot,
      requiredEntries,
      "windows:portable-payload",
      "portable archive bundles executable, runtime manifest, bootstrapper, and scraper payload",
    ),
  ] as const;
};

const verifyWindowsPortablePayload = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  const [, portableFileName] = buildDesktopReleaseArtifactFileNames(metadata, "windows");
  if (!portableFileName) {
    return [
      {
        details: "canonical Windows portable artifact name could not be resolved",
        label: "windows:portable-archive",
        ok: false,
      },
    ] as const;
  }
  const portableRoot = portableFileName.replace(ZIP_EXTENSION_PATTERN, "");
  const extractionRoot = await mkdtemp(join(tmpdir(), "bao-desktop-portable-"));

  return withCleanup(
    async () => {
      const extractResult = await captureResult(() =>
        extractZipArchive(artifact.absolutePath, extractionRoot),
      );
      if (!extractResult.ok) {
        return [
          {
            details: toErrorMessage(extractResult.error),
            label: "windows:portable-archive",
            ok: false,
          },
        ] as const;
      }

      return [
        {
          details: artifact.relativePath,
          label: "windows:portable-archive",
          ok: true,
        },
        ...(await verifyExtractedWindowsPortablePayload(extractionRoot, portableRoot, metadata)),
      ] as const;
    },
    () => rm(extractionRoot, { force: true, recursive: true }),
  );
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
      details: attachResult.timedOut
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
): Promise<readonly VerificationResult[]> => {
  const appRoot = joinArchiveEntry(`${metadata.productName}.app`, "Contents");
  const runtimeRoot = joinArchiveEntry(appRoot, "Resources", DESKTOP_RUNTIME_RESOURCE_DIR);
  const runtimeManifestPath = join(
    mountRoot,
    `${metadata.productName}.app`,
    "Contents",
    "Resources",
    DESKTOP_RUNTIME_RESOURCE_DIR,
    "manifest.json",
  );
  const manifestResult = await readRuntimeManifestForVerification(
    runtimeManifestPath,
    "macos:dmg-manifest",
  );
  if (!hasVerifiedManifest(manifestResult)) {
    return [manifestResult.failure] as const;
  }

  const dependencyPackageNames = await collectRuntimeDependencyPackageNames("macos");
  const requiredEntries = [
    joinArchiveEntry(appRoot, "MacOS", metadata.binaryName),
    ...buildRuntimeContractEntries(runtimeRoot, manifestResult.manifest, dependencyPackageNames),
  ] as const;

  return [
    verifyDesktopRuntimeManifest("macos", manifestResult.manifest, "macos:dmg-manifest"),
    await verifyCollectedEntries(
      mountRoot,
      requiredEntries,
      "macos:dmg-payload",
      "dmg bundles desktop binary, runtime manifest, runner, server, scraper, and dependencies",
    ),
  ] as const;
};

const verifyMacosDmgPayload = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  const mountResult = await attachDmgArtifact(artifact);
  if (!mountResult.ok) {
    return [mountResult.failure] as const;
  }

  const payloadResults = await verifyMountedDmgPayload(mountResult.mountRoot, metadata);
  const detachResult = await detachDmgArtifact(mountResult.mountRoot);

  return [
    {
      details: artifact.relativePath,
      label: "macos:dmg-mount",
      ok: true,
    },
    ...payloadResults,
    detachResult,
  ] as const;
};

const extractLinuxPackagePayload = async (
  artifact: LinuxReleaseArtifact,
  extractionRoot: string,
): Promise<void> => {
  await (artifact.kind === "deb"
    ? extractDebPackage(artifact.absolutePath, extractionRoot)
    : extractRpmPackage(artifact.absolutePath, extractionRoot));
};

const verifyExtractedLinuxPackagePayload = async (
  artifact: LinuxReleaseArtifact,
  metadata: DesktopBundleMetadata,
  extractionRoot: string,
): Promise<readonly VerificationResult[]> => {
  const runtimeRoot = joinArchiveEntry(
    "usr",
    "lib",
    metadata.productName,
    DESKTOP_RUNTIME_RESOURCE_DIR,
  );
  const manifestResult = await readRuntimeManifestForVerification(
    join(
      extractionRoot,
      "usr",
      "lib",
      metadata.productName,
      DESKTOP_RUNTIME_RESOURCE_DIR,
      "manifest.json",
    ),
    `linux:${artifact.kind}-manifest:${artifact.target}`,
  );
  if (!hasVerifiedManifest(manifestResult)) {
    return [manifestResult.failure] as const;
  }

  const dependencyPackageNames = await collectRuntimeDependencyPackageNames(artifact.target);
  const requiredEntries = [
    joinArchiveEntry("usr", "bin", metadata.binaryName),
    ...buildRuntimeContractEntries(runtimeRoot, manifestResult.manifest, dependencyPackageNames),
  ] as const;

  return [
    verifyDesktopRuntimeManifest(
      artifact.target,
      manifestResult.manifest,
      `linux:${artifact.kind}-manifest:${artifact.target}`,
    ),
    await verifyCollectedEntries(
      extractionRoot,
      requiredEntries,
      `linux:${artifact.kind}-payload:${artifact.target}`,
      `${artifact.kind} bundles desktop binary, runtime manifest, runner, server, scraper, and dependencies`,
    ),
  ] as const;
};

const verifyLinuxPackagePayload = async (
  artifact: ReleaseArtifact,
  metadata: DesktopBundleMetadata,
): Promise<readonly VerificationResult[]> => {
  if (!isLinuxPackageArtifact(artifact)) {
    return [] as const;
  }

  // `rpm2cpio <missing> | cpio` can exit 0 on some hosts, so missing RPMs must fail here — not only via dpkg-deb.
  if (!(await pathExists(artifact.absolutePath))) {
    return [
      {
        details: `missing package file (${artifact.relativePath})`,
        label: `linux:${artifact.kind}-archive:${artifact.target}`,
        ok: false,
      },
    ] as const;
  }

  const pointerProbe = await readFilePrefix(artifact.absolutePath, 256);
  if (isGitLfsPointerFileContent(pointerProbe)) {
    return [
      {
        details:
          "Git LFS pointer file; run git lfs pull in the repo root to fetch Linux package binaries",
        label: `linux:${artifact.kind}-archive:${artifact.target}`,
        ok: false,
      },
    ] as const;
  }

  const requiredCommands = artifact.kind === "deb" ? ["dpkg-deb"] : ["rpm2cpio", "cpio"];
  const missingToolResult = requiredCommands
    .map((command) => requireCommand(`linux ${artifact.kind} verification`, command))
    .find((result): result is VerificationResult => result !== null);
  if (missingToolResult) {
    return [missingToolResult] as const;
  }

  const extractionRoot = await mkdtemp(join(tmpdir(), `bao-desktop-${artifact.kind}-`));
  return withCleanup(
    async () => {
      const extractResult = await captureResult(() =>
        extractLinuxPackagePayload(artifact, extractionRoot),
      );
      if (!extractResult.ok) {
        return [
          {
            details: toErrorMessage(extractResult.error),
            label: `linux:${artifact.kind}-archive:${artifact.target}`,
            ok: false,
          },
        ] as const;
      }

      return [
        {
          details: artifact.relativePath,
          label: `linux:${artifact.kind}-archive:${artifact.target}`,
          ok: true,
        },
        ...(await verifyExtractedLinuxPackagePayload(artifact, metadata, extractionRoot)),
      ] as const;
    },
    () => rm(extractionRoot, { force: true, recursive: true }),
  );
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

type VerificationRunContext = {
  readonly artifacts: readonly ReleaseArtifact[];
  readonly metadata: DesktopBundleMetadata;
  readonly releaseMode: boolean;
  readonly releaseProfile: DesktopReleaseArtifactProfile;
  /** When true, skip assembly-level checks (checksums, provenance) that require files only created by the `assemble-release` job. */
  readonly skipAssemblyChecks: boolean;
  readonly targets: readonly DesktopReleaseTarget[];
};

const collectWindowsVerificationResults = async (
  context: VerificationRunContext,
): Promise<readonly VerificationResult[]> => {
  const windowsPortableArtifact = context.targets.includes("windows")
    ? context.artifacts.find(
        (artifact) => artifact.target === "windows" && artifact.kind === "portable",
      )
    : undefined;
  const windowsInstallerArtifact = context.targets.includes("windows")
    ? context.artifacts.find(
        (artifact) => artifact.target === "windows" && artifact.kind === "setup",
      )
    : undefined;
  const windowsMsiArtifact = context.targets.includes("windows")
    ? context.artifacts.find((artifact) => artifact.target === "windows" && artifact.kind === "msi")
    : undefined;
  const windowsSigningConfigured = Boolean(process.env[WINDOWS_CERTIFICATE_ENV]);
  const releaseWindowsSignatures =
    context.targets.includes("windows") &&
    context.releaseMode &&
    process.platform === "win32" &&
    windowsSigningConfigured;

  return [
    ...(context.targets.includes("windows") ? await verifyWindowsNsisPayload() : []),
    ...(windowsPortableArtifact
      ? await verifyWindowsPortablePayload(windowsPortableArtifact, context.metadata)
      : []),
    ...(windowsInstallerArtifact && releaseWindowsSignatures
      ? await verifyWindowsAuthenticode(windowsInstallerArtifact, context.metadata, true)
      : []),
    ...(windowsMsiArtifact && releaseWindowsSignatures
      ? await verifyWindowsAuthenticode(windowsMsiArtifact, context.metadata, false)
      : []),
    ...(windowsPortableArtifact && releaseWindowsSignatures
      ? await verifyWindowsAuthenticode(windowsPortableArtifact, context.metadata, true)
      : []),
  ];
};

const collectArtifactPayloadVerificationResults = async (
  context: VerificationRunContext,
): Promise<readonly VerificationResult[]> => {
  const skipMacosStapler = parseBooleanValue(process.env[SKIP_MACOS_STAPLER_ENV]);
  const verifyMacosNotary =
    context.targets.includes("macos") &&
    context.releaseMode &&
    !skipMacosStapler &&
    process.platform === "darwin";
  const nestedResults = await Promise.all(
    context.artifacts.map(async (artifact) => {
      if (artifact.kind === "dmg") {
        const payloadResults = await verifyMacosDmgPayload(artifact, context.metadata);
        return verifyMacosNotary
          ? [...payloadResults, await verifyMacosNotaryTicket(artifact)]
          : payloadResults;
      }
      if (artifact.kind === "deb" || artifact.kind === "rpm") {
        return verifyLinuxPackagePayload(artifact, context.metadata);
      }
      return [] as const;
    }),
  );
  return nestedResults.flat();
};

const collectArtifactPresenceVerificationResults = async (
  artifacts: readonly ReleaseArtifact[],
): Promise<readonly VerificationResult[]> =>
  Promise.all(
    artifacts.flatMap((artifact) => [
      verifyArtifactPresence(artifact),
      verifyArtifactType(artifact),
    ]),
  );

const collectVerificationResults = async (
  context: VerificationRunContext,
): Promise<readonly VerificationResult[]> => [
  verifySemver(context.metadata),
  ...verifyBundleConfig(context.metadata, context.targets),
  ...(context.skipAssemblyChecks
    ? []
    : await verifyReleaseProvenance(context.metadata, context.targets, context.releaseProfile)),
  ...(await verifyIconAssets()),
  ...(await Promise.all(
    context.targets.map((target) =>
      verifyStagedDirectory(context.metadata, target, context.releaseProfile),
    ),
  )),
  ...(await collectWindowsVerificationResults(context)),
  ...(await collectArtifactPayloadVerificationResults(context)),
  ...(await collectArtifactPresenceVerificationResults(context.artifacts)),
  ...(context.skipAssemblyChecks
    ? []
    : [await verifyChecksumManifest(context.artifacts, context.targets)]),
  ...(context.skipAssemblyChecks ? [] : await verifyChecksumEntries(context.artifacts)),
];

const buildVerificationRunContext = async (
  argv: readonly string[],
): Promise<VerificationRunContext> => {
  const targets = await resolveVerificationTargets(argv);
  const releaseProfile = parseReleaseProfile(argv);
  const metadata = await readDesktopMetadata();
  const releaseRoot = parseReleaseRoot(argv);
  return {
    artifacts: collectExpectedArtifacts(metadata, targets, releaseProfile),
    metadata,
    releaseMode: isReleaseMode(argv),
    releaseProfile,
    skipAssemblyChecks: releaseRoot !== DEFAULT_DESKTOP_RELEASE_ROOT,
    targets,
  };
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  applyReleaseRoot(parseReleaseRoot(argv));
  const context = await buildVerificationRunContext(argv);
  const results = await collectVerificationResults(context);
  await writeOutput(
    `desktop-release:verify targets=${context.targets.join(",")} product=${context.metadata.productName} version=${context.metadata.version} binary=${context.metadata.binaryName}`,
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
