/**
 * Builds the website release manifest (`docs/releases.manifest.json`) from the
 * canonical desktop release tree (`packages/desktop/releases/` by default).
 *
 * SSOT chain:
 *   packages/desktop/releases/provenance.json  -> which artifacts exist per target
 *   packages/desktop/releases/sha256.txt        -> checksum per artifact
 *   <root>/<target>/<file>                       -> real byte size (stat)
 *   <root>/sizes.json (optional)                 -> size override when artifacts are
 *                                                   Git LFS pointers (local dev) or
 *                                                   when generating from a remote tree
 *
 * Output: docs/releases.manifest.json — a website-ready, platform-grouped manifest
 * the docs site fetches at runtime so the download cards are data-driven instead of
 * hardcoded in HTML.
 *
 * Env:
 *   RELEASES_ROOT  default "packages/desktop/releases"
 *   DOCS_MANIFEST  default "docs/releases.manifest.json"
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT_DIRECTORY = new URL("../", import.meta.url).pathname;
const RELEASES_ROOT = resolve(
  ROOT_DIRECTORY,
  process.env.RELEASES_ROOT ?? "packages/desktop/releases",
);
const DOCS_MANIFEST = resolve(
  ROOT_DIRECTORY,
  process.env.DOCS_MANIFEST ?? "docs/releases.manifest.json",
);

const SCHEMA_VERSION = 1;
const LFS_POINTER_MAX_BYTES = 256;
const PRIMARY_RELEASE_EXTENSIONS = new Set(["AppImage", "dmg", "exe"]);
const SHA_LINE_SPLIT_RE = /\s+/;
const VERSION_RE = /(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/;

type ProvenanceFile = {
  name: string;
  directoryId: string;
  size: number;
  sha256: string;
  arch: string;
  kind: string;
  href: string;
  description: string;
  primary: boolean;
};
type PlatformManifest = {
  id: string;
  label: string;
  directories: { id: string; label: string }[];
  files: ProvenanceFile[];
};
type Manifest = {
  schemaVersion: number;
  generatedAt: string;
  version: string;
  sourceProvenance: string;
  platforms: PlatformManifest[];
};

type Provenance = {
  schemaVersion?: number;
  targets: Record<
    string,
    {
      target: string;
      artifactNames: string[];
      hostArch?: string;
      tauriTarget?: string;
    }
  >;
};

const PLATFORM_ORDER = ["windows", "macos", "linux-x64", "linux-arm64"] as const;

const PLATFORM_META: Record<string, { id: string; label: string; directoryId: string }> = {
  windows: { id: "windows", label: "Windows", directoryId: "windows" },
  macos: { id: "macos", label: "Mac", directoryId: "macos" },
  "linux-x64": { id: "linux", label: "Linux", directoryId: "linux-x64" },
  "linux-arm64": { id: "linux", label: "Linux", directoryId: "linux-arm64" },
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function isLfsPointer(path: string): boolean {
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf8").startsWith("version https://git-lfs");
}

function loadSizeOverrides(root: string): Record<string, number> {
  const sizesPath = join(root, "sizes.json");
  if (!existsSync(sizesPath)) return {};
  return readJson<Record<string, number>>(sizesPath);
}

function loadSha256Map(root: string): Record<string, string> {
  const shaPath = join(root, "sha256.txt");
  const map: Record<string, string> = {};
  if (!existsSync(shaPath)) return map;
  for (const line of readFileSync(shaPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [hash, relPath] = trimmed.split(SHA_LINE_SPLIT_RE);
    if (hash && relPath) map[relPath] = hash;
  }
  return map;
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop() ?? "file";
}

function getReleaseKind(fileName: string): string {
  const ext = getExtension(fileName).toLowerCase();
  const lower = fileName.toLowerCase();
  if (ext === "exe") return "Setup file";
  if (ext === "zip") return "Portable file";
  if (ext === "dmg") return "Mac installer";
  if (ext === "deb") return "Debian package";
  if (ext === "rpm") return "RPM package";
  if (ext === "appimage") return "Portable Linux app";
  if (ext === "msi") return "Windows installer (MSI)";
  if (lower.endsWith(".sig")) return "Signature file";
  return "Download file";
}

function getArch(fileName: string, target: string): string {
  const value = `${target} ${fileName}`.toLowerCase();
  if (value.includes("universal")) return "Universal";
  if (value.includes("arm64") || value.includes("aarch64")) return "ARM64";
  if (value.includes("x64") || value.includes("x86_64") || value.includes("amd64")) return "x64";
  return "";
}

function getDescription(platformId: string, fileName: string): string {
  const ext = getExtension(fileName).toLowerCase();
  if (platformId === "windows" && ext === "exe")
    return "Best for most Windows people. This runs the usual setup.";
  if (platformId === "windows" && ext === "zip")
    return "Use this if you want a portable folder instead of a full install.";
  if (platformId === "windows" && ext === "msi") return "Use this if your IT team deploys via MSI.";
  if (platformId === "macos" && ext === "dmg")
    return "Open this on your Mac to start the normal install flow.";
  if (platformId === "linux" && ext === "deb")
    return "Use this if your Linux system installs .deb packages.";
  if (platformId === "linux" && ext === "rpm")
    return "Use this if your Linux system installs .rpm packages.";
  if (platformId === "linux" && ext === "appimage")
    return "Use this if you want a portable Linux app file.";
  return `Open this file if it matches your ${platformId === "macos" ? "Mac" : platformId} computer.`;
}

function deriveVersion(artifactNames: string[]): string {
  for (const name of artifactNames) {
    const match = name.match(VERSION_RE);
    if (match) return match[1];
  }
  return "0.0.0";
}

function fileSize(filePath: string, name: string, overrides: Record<string, number>): number {
  const override = overrides[name];
  if (typeof override === "number" && override > 0) return override;
  if (!existsSync(filePath)) {
    throw new Error(
      `Missing release artifact: ${filePath}. Pull real binaries (git lfs pull) or provide sizes.json override for "${name}".`,
    );
  }
  const stat = statSync(filePath);
  if (stat.size <= LFS_POINTER_MAX_BYTES && isLfsPointer(filePath)) {
    if (typeof override === "number") return override;
    throw new Error(
      `Artifact ${filePath} is a Git LFS pointer, not a real binary. Run \`git lfs pull\` or add a sizes.json override for "${name}".`,
    );
  }
  return stat.size;
}

function buildPlatformManifest(
  platformId: string,
  label: string,
  directories: { id: string; label: string }[],
  targetFiles: { target: string; directoryId: string; name: string }[],
  root: string,
  shaMap: Record<string, string>,
  overrides: Record<string, number>,
): PlatformManifest {
  const files: ProvenanceFile[] = [];
  for (const { target, directoryId, name } of targetFiles) {
    const filePath = join(root, target, name);
    const ext = getExtension(name);
    const size = fileSize(filePath, name, overrides);
    const sha256 = shaMap[`${target}/${name}`] ?? "";
    const arch = getArch(name, target);
    files.push({
      name,
      directoryId,
      size,
      sha256,
      arch,
      kind: getReleaseKind(name),
      href: `releases/${directoryId}/${encodeURIComponent(name)}`,
      description: getDescription(platformId, name),
      primary: PRIMARY_RELEASE_EXTENSIONS.has(ext),
    });
  }
  files.sort((a, b) => {
    const ap = a.primary ? 0 : 1;
    const bp = b.primary ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const ai = directories.findIndex((d) => d.id === a.directoryId);
    const bi = directories.findIndex((d) => d.id === b.directoryId);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
  return { id: platformId, label, directories, files };
}

function orderTargets(provenance: Provenance): string[] {
  const ordered: string[] = [...PLATFORM_ORDER].filter((t) => Object.hasOwn(provenance.targets, t));
  const extras = Object.keys(provenance.targets).filter(
    (t) => !PLATFORM_ORDER.includes(t as (typeof PLATFORM_ORDER)[number]),
  );
  for (const t of extras) {
    if (!PLATFORM_META[t]) PLATFORM_META[t] = { id: t, label: t, directoryId: t };
    ordered.push(t);
  }
  return ordered;
}

function buildPlatformMap(
  orderedTargets: string[],
  provenance: Provenance,
  root: string,
  shaMap: Record<string, string>,
  overrides: Record<string, number>,
): Map<string, PlatformManifest> {
  const platformMap = new Map<string, PlatformManifest>();
  for (const target of orderedTargets) {
    const meta = PLATFORM_META[target] ?? { id: target, label: target, directoryId: target };
    const targetFiles = (provenance.targets[target]?.artifactNames ?? []).map((name) => ({
      target,
      directoryId: meta.directoryId,
      name,
    }));
    let platform = platformMap.get(meta.id);
    if (!platform) {
      platform = { id: meta.id, label: meta.label, directories: [], files: [] };
      platformMap.set(meta.id, platform);
    }
    const dirLabel =
      meta.id === "linux"
        ? `${meta.label} ${target.includes("arm64") ? "ARM64" : "x64"} files`
        : `${meta.label} files`;
    if (!platform.directories.some((d) => d.id === meta.directoryId)) {
      platform.directories.push({ id: meta.directoryId, label: dirLabel });
    }
    const built = buildPlatformManifest(
      meta.id,
      meta.label,
      platform.directories,
      targetFiles,
      root,
      shaMap,
      overrides,
    );
    platform.files.push(...built.files);
  }
  return platformMap;
}

function sortPlatformFiles(platforms: PlatformManifest[]): void {
  for (const p of platforms) {
    p.files.sort((a, b) => {
      const ap = a.primary ? 0 : 1;
      const bp = b.primary ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const ai = p.directories.findIndex((d) => d.id === a.directoryId);
      const bi = p.directories.findIndex((d) => d.id === b.directoryId);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
  }
}

function writeManifest(manifest: Manifest): void {
  mkdirSync(dirname(DOCS_MANIFEST), { recursive: true });
  writeFileSync(DOCS_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const totalFiles = manifest.platforms.reduce((acc, p) => acc + p.files.length, 0);
  process.stdout.write(
    `✓ Wrote ${DOCS_MANIFEST} (v${manifest.version}, ${manifest.platforms.length} platforms, ${totalFiles} files)\n`,
  );
}

function main(): void {
  const provenancePath = join(RELEASES_ROOT, "provenance.json");
  if (!existsSync(provenancePath)) {
    throw new Error(
      `provenance.json not found at ${provenancePath}. Set RELEASES_ROOT to a canonical release tree.`,
    );
  }
  const provenance = readJson<Provenance>(provenancePath);
  const shaMap = loadSha256Map(RELEASES_ROOT);
  const overrides = loadSizeOverrides(RELEASES_ROOT);

  const orderedTargets = orderTargets(provenance);
  const allArtifactNames = orderedTargets.flatMap(
    (t) => provenance.targets[t]?.artifactNames ?? [],
  );
  const version = deriveVersion(allArtifactNames);

  const platformMap = buildPlatformMap(
    orderedTargets,
    provenance,
    RELEASES_ROOT,
    shaMap,
    overrides,
  );
  const platforms = [...platformMap.values()];
  sortPlatformFiles(platforms);

  writeManifest({
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    version,
    sourceProvenance: "packages/desktop/releases/provenance.json",
    platforms,
  });
}

main();
