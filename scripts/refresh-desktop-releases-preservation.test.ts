import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
} from "../packages/shared/src/constants/scripts";
import { captureResult } from "./utils/async-control";
import { stageDesktopReleaseProvenanceFixture } from "./utils/desktop-release-refresh";

const MONOREPO_ROOT = resolve(import.meta.dir, "..");
const REFRESH_SCRIPT = join(MONOREPO_ROOT, "scripts", "refresh-desktop-releases.ts");

const windowsFixtureProvenance = {
  schemaVersion: 1,
  target: "windows",
  strategy: "matching-host-native",
  tauriCli: "repo-local-bun",
  hostPlatform: "win32",
  hostArch: "x64",
  tauriTarget: "x86_64-pc-windows-msvc",
  artifactNames: ["fixture.bin"],
  buildCommands: ["bun tauri build"],
  builtAt: "2020-01-01T00:00:00.000Z",
  ci: { workflow: null, runId: null, runAttempt: null },
} as const;

const seedReleaseWorkspace = async (workspaceRoot: string): Promise<void> => {
  const releasesRoot = join(workspaceRoot, "packages", "desktop", "releases");
  const windowsRoot = join(releasesRoot, "windows");
  const windowsMeta = join(releasesRoot, DESKTOP_RELEASE_METADATA_DIR, "windows");
  await mkdir(windowsRoot, { recursive: true });
  await mkdir(windowsMeta, { recursive: true });
  await writeFile(join(windowsRoot, "fixture.bin"), "windows-payload");
  await writeFile(
    join(windowsMeta, DESKTOP_RELEASE_PROVENANCE_FILENAME),
    JSON.stringify(windowsFixtureProvenance),
  );
  await writeFile(
    join(releasesRoot, DESKTOP_RELEASE_PROVENANCE_FILENAME),
    JSON.stringify({
      schemaVersion: 1,
      assembledAt: "2020-01-01T00:00:00.000Z",
      sourceRoot: "/tmp",
      targets: { windows: windowsFixtureProvenance },
    }),
  );
};

const runRefresh = async (
  env: NodeJS.ProcessEnv,
  extraArgs: readonly string[],
): Promise<number> => {
  const subprocess = Bun.spawn([process.execPath, "run", REFRESH_SCRIPT, ...extraArgs], {
    cwd: MONOREPO_ROOT,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  return subprocess.exited;
};

describe("refresh-desktop-releases target preservation", () => {
  let workspaceRoot: string | undefined;
  let stagingRoot: string | undefined;

  afterEach(async () => {
    if (workspaceRoot) {
      await rm(workspaceRoot, { force: true, recursive: true });
      workspaceRoot = undefined;
    }
    if (stagingRoot) {
      await rm(stagingRoot, { force: true, recursive: true });
      stagingRoot = undefined;
    }
  });

  test("default refresh keeps other canonical targets when only one target is staged", async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), "bao-rel-ws-"));
    stagingRoot = await mkdtemp(join(tmpdir(), "bao-rel-st-"));
    await seedReleaseWorkspace(workspaceRoot);
    await stageDesktopReleaseProvenanceFixture(stagingRoot, "macos");
    await writeFile(join(stagingRoot, "macos", "fixture.bin"), "macos-payload");

    const code = await runRefresh(
      { ...process.env, BAO_DESKTOP_RELEASE_WORKSPACE_ROOT: workspaceRoot },
      ["--source-root", stagingRoot, "--targets", "macos", "--skip-verify"],
    );
    expect(code).toBe(0);

    const windowsBytes = await readFile(
      join(workspaceRoot, "packages", "desktop", "releases", "windows", "fixture.bin"),
    );
    expect(windowsBytes.toString()).toBe("windows-payload");
  });

  test("--replace-release-tree removes canonical targets not included in this refresh", async () => {
    const releaseWorkspace = await mkdtemp(join(tmpdir(), "bao-rel-ws-"));
    const staging = await mkdtemp(join(tmpdir(), "bao-rel-st-"));
    workspaceRoot = releaseWorkspace;
    stagingRoot = staging;
    await seedReleaseWorkspace(releaseWorkspace);
    await stageDesktopReleaseProvenanceFixture(staging, "macos");
    await writeFile(join(staging, "macos", "fixture.bin"), "macos-payload");

    const code = await runRefresh(
      { ...process.env, BAO_DESKTOP_RELEASE_WORKSPACE_ROOT: releaseWorkspace },
      [
        "--source-root",
        staging,
        "--targets",
        "macos",
        "--replace-release-tree",
        "--skip-verify",
      ],
    );
    expect(code).toBe(0);

    const readResult = await captureResult(() =>
      readFile(join(releaseWorkspace, "packages", "desktop", "releases", "windows", "fixture.bin")),
    );
    expect(readResult.ok).toBe(false);
  });
});
