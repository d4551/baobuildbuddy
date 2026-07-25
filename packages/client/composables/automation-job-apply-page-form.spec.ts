import { describe, expect, it } from "vitest";
import { requireApiResponseData } from "~/utils/api-response";
import {
  buildJobApplyBody,
  toCoverLetterSelectOptions,
  toResumeSelectOptions,
} from "./automation-job-apply-select-options";

describe("job-apply bootstrap helpers", () => {
  it("maps resume list payloads to select options", () => {
    expect(
      toResumeSelectOptions([{ id: "r1", name: "Gameplay CV" }, { id: 2 }, { name: "missing id" }]),
    ).toEqual([{ id: "r1", name: "Gameplay CV" }]);
  });

  it("maps cover-letter list payloads to select options", () => {
    expect(
      toCoverLetterSelectOptions([
        { id: "c1", company: "Studio", position: "Engineer" },
        { id: "c2" },
      ]),
    ).toEqual([{ id: "c1", company: "Studio", position: "Engineer" }, { id: "c2" }]);
  });

  it("fail-closes bootstrap envelopes via requireApiResponseData", () => {
    expect(() =>
      toResumeSelectOptions(
        requireApiResponseData(
          { data: null, error: "boom" },
          "bootstrap failed",
          (error, fallback) => (typeof error === "string" ? error : fallback),
        ),
      ),
    ).toThrow("boom");
    expect(
      toResumeSelectOptions(
        requireApiResponseData({ data: [{ id: "r1", name: "A" }] }, "bootstrap failed"),
      ),
    ).toEqual([{ id: "r1", name: "A" }]);
  });

  it("builds submit body with optional cover letter and job id", () => {
    expect(
      buildJobApplyBody({
        jobUrl: { value: " https://jobs.example/1 " },
        resumeId: { value: "r1" },
        coverLetterId: { value: " c1 " },
        jobId: { value: "" },
      }),
    ).toEqual({
      jobUrl: "https://jobs.example/1",
      resumeId: "r1",
      coverLetterId: "c1",
    });
  });
});
