import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  verifyWindowsArtifactMagicFile,
  WINDOWS_ARTIFACT_MAGIC,
} from "./verify-desktop-release-artifacts";

const MSI_MIN_HEADER_BYTES = 72;
const PE_MZ = WINDOWS_ARTIFACT_MAGIC.setup;
const CFB_MSI = WINDOWS_ARTIFACT_MAGIC.msi;

/**
 * Behavior regression: MSI is OLE/CFB, not PE MZ. Calls the real magic verifier
 * (not source-string theater).
 */
describe("windows MSI magic verification", () => {
  test("accepts CFB MSI header and rejects PE masquerading as MSI", async () => {
    const root = await mkdtemp(join(tmpdir(), "bao-msi-magic-"));
    const windowsDir = join(root, "windows");
    await mkdir(windowsDir, { recursive: true });

    const cfbPath = join(windowsDir, "BaoBuildBuddy_0.1.0_x64_en-US.msi");
    const peAsMsiPath = join(windowsDir, "fake-pe.msi");
    const cfb = new Uint8Array(MSI_MIN_HEADER_BYTES);
    cfb.set(CFB_MSI, 0);
    await writeFile(cfbPath, cfb);

    const pe = new Uint8Array(MSI_MIN_HEADER_BYTES);
    pe.set(PE_MZ, 0);
    await writeFile(peAsMsiPath, pe);

    const cfbResult = await verifyWindowsArtifactMagicFile(cfbPath, "msi");
    expect(cfbResult.ok).toBe(true);
    expect(cfbResult.details).toContain("msi");

    const peResult = await verifyWindowsArtifactMagicFile(peAsMsiPath, "msi");
    expect(peResult.ok).toBe(false);
    expect(peResult.details).toContain("mismatch");
  });
});
