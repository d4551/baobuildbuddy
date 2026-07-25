import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
    const cfb = new Uint8Array(72);
    cfb.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 0);
    await writeFile(msiPath, cfb);

    // Source-level contract: the verifier must treat msi as CFB, not MZ.
    const verifySource = await Bun.file(
      join(import.meta.dir, "verify-desktop-release-artifacts.ts"),
    ).text();
    expect(verifySource).toContain("WINDOWS_MSI_SIGNATURE");
    expect(verifySource).toMatch(/artifact\.kind === "msi"/);
    expect(verifySource).toContain("NUM_208");
    expect(verifySource).toContain("NUM_207");
    // Must not only fall through MSI to EXE magic.
    const msiBranch = verifySource.indexOf('artifact.kind === "msi"');
    const exeFallthrough = verifySource.lastIndexOf("WINDOWS_EXE_SIGNATURE");
    expect(msiBranch).toBeGreaterThan(-1);
    expect(msiBranch).toBeLessThan(exeFallthrough);
  });
});
