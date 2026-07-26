import { describe, expect, test } from "bun:test";
import { coverLetterPrompt, resumeEnhancePrompt } from "./prompts-resume";

/**
 * Guards the two prompts that were context-blind.
 *
 * `coverLetterPrompt` instructs the model to "demonstrate knowledge of the company
 * and their games" — these tests prove the studio and job facts are actually in the
 * prompt text, so that instruction is backed by data. `resumeEnhancePrompt` used to
 * be called positionally with the requested section landing in its `jobDescription`
 * slot; the section is now a distinct labelled field.
 */

const STUDIO_CONTEXT = `Studio context:
- Name: Riot Games
- Technologies: C++, Proprietary Engine
- Hiring signals: Live-service experience`;

const JOB_CONTEXT = `Job context:
- Job title: Senior Gameplay Engineer
- Requirements: 5+ years C++; Multiplayer netcode
- Description: Own gameplay systems for a live-service title.`;

const SKILL_CONTEXT = `Transferable skill context:
- Guild raid leadership → Cross-functional team leadership`;

describe("coverLetterPrompt", () => {
  test("carries the studio, job and skill context into the prompt", () => {
    const prompt = coverLetterPrompt({
      company: "Riot Games",
      position: "Senior Gameplay Engineer",
      jobInfo: "No additional job information provided",
      resumeContext: "Shipped two multiplayer titles.",
      studioContext: STUDIO_CONTEXT,
      jobContext: JOB_CONTEXT,
      skillContext: SKILL_CONTEXT,
    });

    expect(prompt).toContain("Proprietary Engine");
    expect(prompt).toContain("Live-service experience");
    expect(prompt).toContain("Multiplayer netcode");
    expect(prompt).toContain("Own gameplay systems for a live-service title.");
    expect(prompt).toContain("Cross-functional team leadership");
    expect(prompt).toContain("Shipped two multiplayer titles.");
  });

  test("forbids inventing employer detail when context is supplied", () => {
    const prompt = coverLetterPrompt({
      company: "Riot Games",
      position: "Engineer",
      jobInfo: "",
      resumeContext: "",
      studioContext: STUDIO_CONTEXT,
    });
    expect(prompt).toContain("never invent titles, technologies or");
  });

  test("still renders without optional context", () => {
    const prompt = coverLetterPrompt({
      company: "Indie Co",
      position: "Designer",
      jobInfo: "No additional job information provided",
      resumeContext: "",
    });
    expect(prompt).toContain("Indie Co");
    expect(prompt).toContain("Designer");
    expect(prompt).not.toContain("Candidate Background:");
  });
});

describe("resumeEnhancePrompt", () => {
  test("labels the focus section instead of passing it as a job description", () => {
    const prompt = resumeEnhancePrompt({ resume: "Resume body", section: "summary" });
    expect(prompt).toContain("Focus section: summary");
    expect(prompt).not.toContain("Target Job Description:\nsummary");
  });

  test("carries job, studio and skill context into the prompt", () => {
    const prompt = resumeEnhancePrompt({
      resume: "Resume body",
      section: "all",
      jobContext: JOB_CONTEXT,
      studioContext: STUDIO_CONTEXT,
      skillContext: SKILL_CONTEXT,
    });
    expect(prompt).toContain("Senior Gameplay Engineer");
    expect(prompt).toContain("Riot Games");
    expect(prompt).toContain("Cross-functional team leadership");
  });

  test("omits empty context blocks rather than emitting blank sections", () => {
    const prompt = resumeEnhancePrompt({
      resume: "Resume body",
      section: "all",
      jobContext: "",
      studioContext: undefined,
    });
    expect(prompt).toContain("Focus section: all");
    expect(prompt).not.toContain("Job context:");
  });
});
