/**
 * Publishes the staged docs site to the static web host over FTPS.
 *
 * The site (https://bao.builders) is served from an FTP-backed static host,
 * and nothing in the repo previously drove that upload — the page and its release
 * artifacts were generated but never shipped. This is that missing step.
 *
 * Credentials are read from the environment and never from a file in the repo, so
 * the deploy runs the same way locally and from CI (where they are repository
 * secrets). The script refuses to run if any of them is missing.
 *
 * Usage:
 *   bun run docs-site:bundle
 *   BAO_DOCS_FTP_HOST=... BAO_DOCS_FTP_USER=... BAO_DOCS_FTP_PASSWORD=... \
 *     bun run docs-site:deploy
 *   bun run docs-site:deploy -- --dry-run     # list the upload plan, connect to nothing
 *
 * Env:
 *   BAO_DOCS_FTP_HOST         required — the static host's FTP hostname
 *   BAO_DOCS_FTP_USER         required
 *   BAO_DOCS_FTP_PASSWORD     required
 *   BAO_DOCS_FTP_PORT         default 21
 *   BAO_DOCS_FTP_REMOTE_ROOT  default "/" — remote directory the site is served from
 *   BAO_DOCS_FTP_SECURE       default "true" — explicit FTPS (AUTH TLS). "false" only
 *                             for a host that cannot do TLS; credentials then travel
 *                             in clear text.
 *   BAO_DOCS_FTP_TIMEOUT_MS   default 30000
 *   DOCS_SITE_OUT             default "dist/docs-site" — the staged tree to upload
 */
import { existsSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { BYTES_KILO } from "../packages/shared/src/constants/numeric";
import { settle } from "../packages/shared/src/utils/promise";

const ROOT_DIRECTORY = new URL("../", import.meta.url).pathname;
const BUNDLE_ROOT = resolve(ROOT_DIRECTORY, process.env.DOCS_SITE_OUT ?? "dist/docs-site");
const DEFAULT_FTP_PORT = 21;
const DEFAULT_TIMEOUT_MS = 30_000;
const BYTES_PER_MEBIBYTE = BYTES_KILO * BYTES_KILO;

export type FtpDeployConfig = {
  host: string;
  user: string;
  password: string;
  port: number;
  remoteRoot: string;
  secure: boolean;
  timeoutMs: number;
};

export type FtpConfigResult =
  | { ok: true; config: FtpDeployConfig }
  | { ok: false; missing: string[] };

const REQUIRED_ENVIRONMENT_KEYS = [
  "BAO_DOCS_FTP_HOST",
  "BAO_DOCS_FTP_USER",
  "BAO_DOCS_FTP_PASSWORD",
] as const;

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Fail-closed config read. Returns the missing keys rather than throwing so the
 * caller can name all of them at once instead of one per run.
 */
export const readFtpDeployConfig = (
  environment: Readonly<Record<string, string | undefined>>,
): FtpConfigResult => {
  const missing = REQUIRED_ENVIRONMENT_KEYS.filter(
    (key) => (environment[key] ?? "").trim().length === 0,
  );
  if (missing.length > 0) {
    return { ok: false, missing: [...missing] };
  }
  return {
    ok: true,
    config: {
      host: (environment.BAO_DOCS_FTP_HOST ?? "").trim(),
      user: (environment.BAO_DOCS_FTP_USER ?? "").trim(),
      password: environment.BAO_DOCS_FTP_PASSWORD ?? "",
      port: parsePositiveInteger(environment.BAO_DOCS_FTP_PORT, DEFAULT_FTP_PORT),
      remoteRoot: (environment.BAO_DOCS_FTP_REMOTE_ROOT ?? "/").trim() || "/",
      secure: (environment.BAO_DOCS_FTP_SECURE ?? "true").trim().toLowerCase() !== "false",
      timeoutMs: parsePositiveInteger(environment.BAO_DOCS_FTP_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    },
  };
};

const collectBundleFiles = async (): Promise<string[]> => {
  const glob = new Bun.Glob("**/*");
  const files = await Array.fromAsync(glob.scan({ cwd: BUNDLE_ROOT, onlyFiles: true }));
  return files.map((filePath) => filePath.replace(/\\/gu, "/")).sort();
};

const describePlan = (files: readonly string[]): string => {
  const totalBytes = files.reduce(
    (accumulator, filePath) => accumulator + statSync(resolve(BUNDLE_ROOT, filePath)).size,
    0,
  );
  const megabytes = (totalBytes / BYTES_PER_MEBIBYTE).toFixed(1);
  return `${files.length} file(s), ${megabytes} MiB`;
};

const uploadBundle = async (config: FtpDeployConfig, files: readonly string[]): Promise<void> => {
  const { Client } = await import("basic-ftp");
  const client = new Client(config.timeoutMs);
  client.ftp.verbose = false;

  const accessResult = await settle(
    client.access({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      secure: config.secure,
    }),
  );
  if (accessResult.status === "rejected") {
    client.close();
    throw new Error(
      `FTP login failed for ${config.user}@${config.host}:${config.port}: ${accessResult.reason.message}`,
    );
  }

  const uploadResult = await settle(
    client.ensureDir(config.remoteRoot).then(() => client.uploadFromDir(BUNDLE_ROOT)),
  );
  client.close();
  if (uploadResult.status === "rejected") {
    throw new Error(`FTP upload failed: ${uploadResult.reason.message}`);
  }
  process.stdout.write(
    `✓ Published ${describePlan(files)} to ${config.host}${config.remoteRoot}\n`,
  );
};

const main = async (): Promise<void> => {
  const dryRun = process.argv.includes("--dry-run");

  if (!existsSync(BUNDLE_ROOT)) {
    throw new Error(`Nothing staged at ${BUNDLE_ROOT}. Run \`bun run docs-site:bundle\` first.`);
  }
  const files = await collectBundleFiles();
  if (files.length === 0) {
    throw new Error(`Staged bundle at ${BUNDLE_ROOT} is empty.`);
  }

  const configResult = readFtpDeployConfig(process.env);
  if (!configResult.ok) {
    if (dryRun) {
      process.stdout.write(
        `Dry run — would upload ${describePlan(files)} from ${relative(ROOT_DIRECTORY, BUNDLE_ROOT)}:\n${files
          .map((filePath) => `  ${filePath}`)
          .join("\n")}\n`,
      );
      process.stdout.write(`! Not configured to publish: set ${configResult.missing.join(", ")}\n`);
      return;
    }
    throw new Error(
      `Missing FTP credentials: ${configResult.missing.join(", ")}. Set them in the environment (CI: repository secrets); never commit them.`,
    );
  }

  if (dryRun) {
    process.stdout.write(
      `Dry run — would upload ${describePlan(files)} to ${configResult.config.host}${configResult.config.remoteRoot} (secure=${configResult.config.secure}):\n${files
        .map((filePath) => `  ${filePath}`)
        .join("\n")}\n`,
    );
    return;
  }

  await uploadBundle(configResult.config, files);
};

if (import.meta.main) {
  await main();
}
