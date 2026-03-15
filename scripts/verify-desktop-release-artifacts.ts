import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_LINUX_ARCH,
  DESKTOP_RELEASE_LINUX_DEB_ARCH,
  DESKTOP_RELEASE_MACOS_ARCH,
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_RELEASE_WINDOWS_ARCH,
  DESKTOP_REQUIRED_NATIVE_ICON_FILES,
  DESKTOP_REQUIRED_PNG_ICON_SPECS,
  DISK_IMAGE_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";
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

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_SIGNATURE = Uint8Array.from([0, 0, 1, 0]);
const ICNS_SIGNATURE = Uint8Array.from([105, 99, 110, 115]);
const APPIMAGE_SIGNATURE = Uint8Array.from([65, 73, 2]);
const DEB_SIGNATURE = Uint8Array.from([33, 60, 97, 114, 99, 104, 62, 10]);
const RPM_SIGNATURE = Uint8Array.from([237, 171, 238, 219]);
const WINDOWS_EXE_SIGNATURE = Uint8Array.from([77, 90]);
const REQUIRED_ICO_LAYER_SIZES = [16, 24, 32, 48, 64, 256] as const;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u;
const SHA256_ENTRY_PATTERN = /^([a-f0-9]{64}) {2}(.+)$/u;
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const CARGO_PACKAGE_NAME_PATTERN = /^name = "([^"]+)"/m;

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

const pathExists = async (absolutePath: string): Promise<boolean> => Bun.file(absolutePath).exists();

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

  const parsedTargets = DESKTOP_RELEASE_TARGETS.filter((target) => requestedTargets.includes(target));
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
    version,
  };
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

const buildMacosArtifacts = (
  metadata: DesktopBundleMetadata,
): readonly ReleaseArtifact[] => {
  const relativePath = join(
    "macos",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_MACOS_ARCH}.dmg`,
  );
  return [createReleaseArtifact("macos", relativePath, "dmg")] as const;
};

const buildLinuxArtifacts = (
  metadata: DesktopBundleMetadata,
): readonly ReleaseArtifact[] => {
  const appImagePath = join(
    "linux",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_LINUX_ARCH}.AppImage`,
  );
  const debPath = join(
    "linux",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_LINUX_DEB_ARCH}.deb`,
  );
  const rpmPath = join(
    "linux",
    `${metadata.productName}-${metadata.version}-1.${DESKTOP_RELEASE_LINUX_ARCH}.rpm`,
  );

  return [
    createReleaseArtifact("linux", appImagePath, "appimage"),
    createReleaseArtifact("linux", debPath, "deb"),
    createReleaseArtifact("linux", rpmPath, "rpm"),
  ] as const;
};

const buildWindowsArtifacts = (
  metadata: DesktopBundleMetadata,
): readonly ReleaseArtifact[] => {
  const setupPath = join(
    "windows",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-setup.exe`,
  );
  const portablePath = join(
    "windows",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-portable.exe`,
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

  if (target === "linux") {
    return buildLinuxArtifacts(metadata);
  }

  return buildWindowsArtifacts(metadata);
};

const collectExpectedArtifacts = (
  metadata: DesktopBundleMetadata,
  targets: readonly DesktopReleaseTarget[],
): readonly ReleaseArtifact[] => targets.flatMap((target) => buildArtifactsForTarget(metadata, target));

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
    isPng &&
    actualWidth === width &&
    actualHeight === height &&
    bitDepth === 8 &&
    colorType === 6;

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
      ? `icon.ico layers ${Array.from(layerSizes).sort((left, right) => left - right).join(",")}`
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
        ["appimage", "deb", "dmg", "nsis", "rpm"].every((target) =>
          metadata.tauriTargets.includes(target),
        )),
  };

  const gtkResult: VerificationResult | null = targets.includes("linux")
    ? {
        details: metadata.enableGtkAppId ? "enabled" : "disabled",
        label: "config:gtk-app-id",
        ok: metadata.enableGtkAppId,
      }
    : null;

  return [
    versionResult,
    identifierResult,
    targetResult,
    verifyBundleIconConfig(metadata),
    ...(gtkResult ? [gtkResult] : []),
  ];
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

const captureCommand = (
  command: readonly string[],
  timeoutMs: number,
): Promise<CommandCapture> =>
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

    const stdoutPromise = proc.stdout instanceof ReadableStream ? new Response(proc.stdout).text() : Promise.resolve("");
    const stderrPromise = proc.stderr instanceof ReadableStream ? new Response(proc.stderr).text() : Promise.resolve("");

    const settleCapture = async (): Promise<void> => {
      const [exitCode, stdout, stderr] = await Promise.all([proc.exited, stdoutPromise, stderrPromise]);
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

const verifyDmgArtifact = async (artifact: ReleaseArtifact): Promise<VerificationResult> => {
  const commandResult = await captureCommand(["hdiutil", "verify", artifact.absolutePath], DISK_IMAGE_TIMEOUT_MS);
  return {
    details: commandResult.exitCode === 0
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
    const ok = bytesStartWith(elfPrefix, Uint8Array.from([127, 69, 76, 70])) &&
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
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  const expectedArtifacts = buildArtifactsForTarget(metadata, target).map((artifact) =>
    basename(artifact.relativePath),
  );
  const actualArtifacts = directoryEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((entryName) => entryName.includes(metadata.productName));
  const unexpectedArtifacts = actualArtifacts.filter((entryName) => !expectedArtifacts.includes(entryName));
  const missingArtifacts = expectedArtifacts.filter((entryName) => !actualArtifacts.includes(entryName));

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

const verifyChecksumEntries = async (
  artifacts: readonly ReleaseArtifact[],
): Promise<readonly VerificationResult[]> => {
  const checksumEntries = await readChecksumEntries();
  return Promise.all(
    artifacts.map(async (artifact) => {
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

  const results = [
    verifySemver(metadata),
    ...verifyBundleConfig(metadata, targets),
    ...(await verifyIconAssets()),
    ...(await Promise.all(targets.map((target) => verifyStagedDirectory(metadata, target)))),
    ...(await Promise.all(
      artifacts.flatMap((artifact) => [verifyArtifactPresence(artifact), verifyArtifactType(artifact)]),
    )),
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
