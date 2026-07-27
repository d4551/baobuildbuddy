/**
 * Assembles the complete deployable docs site into a single output directory.
 *
 * `build:docs-site` generates the two files the page needs at runtime (the Tailwind
 * bundle and `docs/releases/manifest.json`), but nothing previously staged the rest
 * of the tree the page links to: `docs/index.html` references
 * `releases/sha256.txt`, `releases/provenance.json` and one
 * `releases/<platform>/<file>` per download card, and those live in the canonical
 * release tree under `packages/desktop/releases`. Publishing `docs/` alone ships a
 * download page whose every download 404s.
 *
 * SSOT chain (no mapping is re-derived here):
 *   docs/releases/manifest.json  -> which files are published, and at which href
 *   packages/desktop/releases/   -> the bytes, checksums and provenance
 *
 * Usage:
 *   bun run build:docs-site && bun run scripts/build-docs-site-bundle.ts
 *   bun run docs-site:bundle                       # both of the above
 *   bun run docs-site:bundle -- --skip-artifacts   # page + manifest + checksums only
 *
 * Env:
 *   DOCS_SITE_ROOT    default "docs"
 *   RELEASES_ROOT     default "packages/desktop/releases"
 *   DOCS_SITE_OUT     default "dist/docs-site"
 */
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { isRecord } from "../packages/shared/src/utils/type-guards";

const ROOT_DIRECTORY = new URL("../", import.meta.url).pathname;
const DOCS_SITE_ROOT = resolve(ROOT_DIRECTORY, process.env.DOCS_SITE_ROOT ?? "docs");
const RELEASES_ROOT = resolve(
  ROOT_DIRECTORY,
  process.env.RELEASES_ROOT ?? "packages/desktop/releases",
);
const OUTPUT_ROOT = resolve(ROOT_DIRECTORY, process.env.DOCS_SITE_OUT ?? "dist/docs-site");

const LFS_POINTER_PREFIX = "version https://git-lfs";
const LFS_POINTER_MAX_BYTES = 256;

/** Page shell copied verbatim; every entry must exist or the deploy is incomplete. */
const REQUIRED_SITE_FILES = [
  "index.html",
  "favicon.svg",
  "assets/docs.generated.css",
  "assets/tux.svg",
  "releases/manifest.json",
] as const;

/** Verification artifacts the page links to, copied out of the release tree. */
const RELEASE_METADATA_FILES = ["sha256.txt", "provenance.json"] as const;

type ManifestFile = { name: string; directoryId: string; href: string };
type Manifest = { version: string; platforms: Array<{ files: ManifestFile[] }> };

export type BundleEntry = { source: string; target: string };

export const isLfsPointerFile = (path: string): boolean => {
  if (!existsSync(path) || statSync(path).size > LFS_POINTER_MAX_BYTES) {
    return false;
  }
  return readFileSync(path, "utf8").startsWith(LFS_POINTER_PREFIX);
};

/**
 * Resolves a manifest-supplied relative path under `root`, failing closed if it
 * escapes. `href` is percent-encoded in the manifest and has to be decoded before
 * it can be used as a path, which is exactly where an encoded `..` or separator
 * would let a hand-edited manifest write outside the staging directory.
 */
const resolveContainedPath = (root: string, relativePath: string, label: string): string => {
  const resolvedRoot = resolve(root);
  const resolved = resolve(resolvedRoot, relativePath);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(
      `Release manifest ${label} "${relativePath}" resolves outside ${resolvedRoot}. Refusing to stage it.`,
    );
  }
  return resolved;
};

/**
 * Maps every manifest entry to its source in the canonical release tree.
 * `directoryId` is both the published path segment and the release-tree
 * subdirectory, so the layout is not re-derived here.
 */
export const collectArtifactEntries = (
  manifest: Manifest,
  releasesRoot: string,
  outputRoot: string,
): BundleEntry[] =>
  manifest.platforms
    .flatMap((platform) => platform.files)
    .map((file) => ({
      source: resolveContainedPath(
        releasesRoot,
        join(file.directoryId, file.name),
        "artifact source",
      ),
      target: resolveContainedPath(outputRoot, decodeURIComponent(file.href), "href"),
    }));

const copyFile = (source: string, target: string): void => {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source));
};

/** Narrows to a list without letting `any` in from `JSON.parse`. */
const isUnknownList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

const isManifestFile = (value: unknown): value is ManifestFile =>
  isRecord(value) &&
  typeof value.name === "string" &&
  typeof value.directoryId === "string" &&
  typeof value.href === "string";

const readPlatformFiles = (platform: unknown): ManifestFile[] => {
  if (!isRecord(platform) || !isUnknownList(platform.files)) {
    return [];
  }
  return platform.files.filter(isManifestFile);
};

const readManifest = (path: string): Manifest => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isRecord(parsed) || typeof parsed.version !== "string" || !isUnknownList(parsed.platforms)) {
    throw new Error(`Malformed release manifest at ${path}`);
  }
  return {
    version: parsed.version,
    platforms: parsed.platforms.map((platform) => ({ files: readPlatformFiles(platform) })),
  };
};

const requireSiteFiles = (): void => {
  const missing = REQUIRED_SITE_FILES.filter(
    (relativePath) => !existsSync(join(DOCS_SITE_ROOT, relativePath)),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing generated docs-site inputs: ${missing.join(", ")}. Run \`bun run build:docs-site\` first.`,
    );
  }
};

const copyArtifacts = (entries: readonly BundleEntry[], skipArtifacts: boolean): number => {
  if (skipArtifacts) {
    process.stdout.write(
      `! Skipping ${entries.length} release artifact(s) (--skip-artifacts); download links will 404 until a full bundle is published\n`,
    );
    return 0;
  }
  const pointers = entries.filter((entry) => isLfsPointerFile(entry.source));
  if (pointers.length > 0) {
    throw new Error(
      `These release artifacts are Git LFS pointers, not real binaries: ${pointers
        .map((entry) => entry.source)
        .join(
          ", ",
        )}. Run \`git lfs pull\`, or pass --skip-artifacts to publish the page without them.`,
    );
  }
  const absent = entries.filter((entry) => !existsSync(entry.source));
  if (absent.length > 0) {
    throw new Error(
      `Missing release artifacts: ${absent.map((entry) => entry.source).join(", ")}.`,
    );
  }
  for (const entry of entries) {
    copyFile(entry.source, entry.target);
  }
  return entries.length;
};

const main = (): void => {
  const skipArtifacts = process.argv.includes("--skip-artifacts");
  requireSiteFiles();

  rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  mkdirSync(OUTPUT_ROOT, { recursive: true });

  for (const relativePath of REQUIRED_SITE_FILES) {
    copyFile(join(DOCS_SITE_ROOT, relativePath), join(OUTPUT_ROOT, relativePath));
  }

  for (const name of RELEASE_METADATA_FILES) {
    const source = join(RELEASES_ROOT, name);
    if (!existsSync(source)) {
      throw new Error(`Missing release metadata: ${source}`);
    }
    copyFile(source, join(OUTPUT_ROOT, "releases", name));
  }

  const manifest = readManifest(join(DOCS_SITE_ROOT, "releases", "manifest.json"));
  const artifactEntries = collectArtifactEntries(manifest, RELEASES_ROOT, OUTPUT_ROOT);
  const copiedArtifacts = copyArtifacts(artifactEntries, skipArtifacts);

  process.stdout.write(
    `✓ Staged docs site v${manifest.version} at ${OUTPUT_ROOT} (${REQUIRED_SITE_FILES.length + RELEASE_METADATA_FILES.length} page files, ${copiedArtifacts} release artifacts)\n`,
  );
};

if (import.meta.main) {
  main();
}
