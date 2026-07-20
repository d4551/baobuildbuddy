import { describe, expect, it } from "vitest";
import type { JobProviderForm } from "~/components/settings/job-intelligence";
import { countActiveJobProviderSources } from "~/utils/job-provider-source-count";

const baseForm = (): JobProviderForm => ({
  providerTimeoutMs: 5000,
  companyBoardResultLimit: 50,
  gamingBoardResultLimit: 50,
  unknownLocationLabel: "Unknown",
  unknownCompanyLabel: "Unknown",
  hitmarkerEnabled: false,
  hitmarkerApiBaseUrl: "https://api.hitmarker.net/v1/jobs",
  hitmarkerDefaultQuery: "game",
  hitmarkerDefaultLocation: "",
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

  it("counts hitmarker + enabled portal with fallback URL", () => {
    const form = baseForm();
    form.hitmarkerEnabled = true;
    form.gamingPortalsJson = JSON.stringify([
      {
        id: "hitmarker",
        name: "Hitmarker",
        source: "hitmarker",
        fallbackUrl: "https://hitmarker.net/jobs",
        enabled: true,
      },
    ]);
    expect(countActiveJobProviderSources(form)).toBe(2);
  });

  it("counts greenhouse only when an enabled board token exists", () => {
    const form = baseForm();
    form.greenhouseBoardsJson = JSON.stringify([{ token: "acme", enabled: true }]);
    expect(countActiveJobProviderSources(form)).toBe(1);
  });
});
