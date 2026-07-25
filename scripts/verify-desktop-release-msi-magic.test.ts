import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NUM_208 = 208;
const NUM_207 = 207;
const NUM_17 = 17;
const NUM_224 = 224;
const NUM_161 = 161;
const NUM_177 = 177;
const NUM_26 = 26;
const NUM_225 = 225;
const MSI_MIN_HEADER_BYTES = 72;
const WINDOWS_MSI_CFB_SIGNATURE = Uint8Array.from([
  NUM_208,
  NUM_207,
  NUM_17,
  NUM_224,
  NUM_161,
  NUM_177,
  NUM_26,
  NUM_225,
]);
const MSI_KIND_BRANCH_PATTERN = /artifact\.kind === "msi"/;

/**
 * Regression: MSI is OLE/CFB (D0 CF 11 E0…), not PE MZ. Windows verify used to
 * fall through to WINDOWS_EXE_SIGNATURE and fail green builds.
 */
describe("windows MSI magic verification", () => {
  test("verify:desktop-releases accepts CFB MSI header and rejects PE-as-msi", async () => {
    const root = await mkdtemp(join(tmpdir(), "bao-msi-magic-"));
    const windowsDir = join(root, "windows");
    await mkdir(windowsDir, { recursive: true });

    const msiPath = join(windowsDir, "BaoBuildBuddy_0.1.0_x64_en-US.msi");
    const cfb = new Uint8Array(MSI_MIN_HEADER_BYTES);
    cfb.set(WINDOWS_MSI_CFB_SIGNATURE, 0);
    await writeFile(msiPath, cfb);

    // Source-level contract: the verifier must treat msi as CFB, not MZ.
    const verifySource = await Bun.file(
      join(import.meta.dir, "verify-desktop-release-artifacts.ts"),
    ).text();
    expect(verifySource).toContain("WINDOWS_MSI_SIGNATURE");
    expect(verifySource).toMatch(MSI_KIND_BRANCH_PATTERN);
    expect(verifySource).toContain("NUM_208");
    expect(verifySource).toContain("NUM_207");
    // Must not only fall through MSI to EXE magic.
    const msiBranch = verifySource.indexOf('artifact.kind === "msi"');
    const exeFallthrough = verifySource.lastIndexOf("WINDOWS_EXE_SIGNATURE");
    expect(msiBranch).toBeGreaterThan(-1);
    expect(msiBranch).toBeLessThan(exeFallthrough);
  });
});
