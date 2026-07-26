import { describe, expect, it } from "vitest";
import type { JobProviderForm } from "~/components/settings/job-intelligence";
import { countActiveJobProviderSources } from "~/utils/job-provider-source-count";

const baseForm = (): JobProviderForm => ({
  providerTimeoutMs: 5000,
  companyBoardResultLimit: 50,
  gamingBoardResultLimit: 50,
  unknownLocationLabel: "Unknown",
  unknownCompanyLabel: "Unknown",
  greenhouseApiBaseUrl: "https://boards.greenhouse.io",
  greenhouseMaxPages: 1,
  leverApiBaseUrl: "https://api.lever.co",
  leverMaxPages: 1,
  greenhouseBoardsJson: "[]",
  leverCompaniesJson: "[]",
  companyBoardsJson: "[]",
  companyBoardApiTemplatesJson: "{}",
  gamingPortalsJson: "[]",
});

describe("countActiveJobProviderSources", () => {
  it("ignores bare API base URLs without enabled boards/companies", () => {
    expect(countActiveJobProviderSources(baseForm())).toBe(0);
  });

  // Hitmarker counts once, through its portal entry — there is no separate
  // API-provider flag to double-count any more.
  it("counts an enabled gaming portal with a fallback URL exactly once", () => {
    const form = baseForm();
    form.gamingPortalsJson = JSON.stringify([
      {
        id: "hitmarker",
        name: "Hitmarker",
        source: "hitmarker",
        fallbackUrl: "https://hitmarker.net/jobs",
        enabled: true,
      },
    ]);
    expect(countActiveJobProviderSources(form)).toBe(1);
  });

  it("counts greenhouse only when an enabled board token exists", () => {
    const form = baseForm();
    form.greenhouseBoardsJson = JSON.stringify([{ token: "acme", enabled: true }]);
    expect(countActiveJobProviderSources(form)).toBe(1);
  });

  it("counts a board written in the persisted greenhouseBoardConfig shape", () => {
    // `greenhouseBoardConfigSchema` identifies a board by `board`, not `token`, so a
    // saved board used to count as zero active sources.
    const form = baseForm();
    form.greenhouseBoardsJson = JSON.stringify([
      { board: "acme", company: "Acme Games", enabled: true },
    ]);
    expect(countActiveJobProviderSources(form)).toBe(1);
  });

  it("ignores a board that is enabled but has no identity", () => {
    const form = baseForm();
    form.greenhouseBoardsJson = JSON.stringify([{ company: "Acme Games", enabled: true }]);
    expect(countActiveJobProviderSources(form)).toBe(0);
  });
});
