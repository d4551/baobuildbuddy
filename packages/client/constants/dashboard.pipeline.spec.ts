import { describe, expect, it } from "vitest";
import { resolveDashboardFlowActions, resolveDashboardPipelineSteps } from "./dashboard-pipeline";

describe("resolveDashboardPipelineSteps", () => {
  it("marks first step as in progress when no data is available", () => {
    const steps = resolveDashboardPipelineSteps({
      savedJobs: 0,
      appliedJobs: 0,
      resumeCount: 0,
      coverLetterCount: 0,
      automationRuns: 0,
      successfulAutomationRuns: 0,
      mappedSkillsCount: 0,
      gamificationXp: 0,
    });

    expect(steps.map((step) => step.status)).toEqual([
      "inProgress",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("marks all steps complete for a full end-to-end workflow snapshot", () => {
    const steps = resolveDashboardPipelineSteps({
      savedJobs: 3,
      appliedJobs: 2,
      resumeCount: 1,
      coverLetterCount: 1,
      automationRuns: 4,
      successfulAutomationRuns: 2,
      mappedSkillsCount: 5,
      gamificationXp: 320,
    });

    expect(steps.every((step) => step.status === "complete")).toBe(true);
  });

  it("sets customize as in progress when discovery and scraping are complete", () => {
    const steps = resolveDashboardPipelineSteps({
      savedJobs: 5,
      appliedJobs: 0,
      resumeCount: 0,
      coverLetterCount: 0,
      automationRuns: 2,
      successfulAutomationRuns: 0,
      mappedSkillsCount: 0,
      gamificationXp: 0,
    });

    const statusById = Object.fromEntries(steps.map((step) => [step.id, step.status]));
    expect(statusById.search).toBe("complete");
    expect(statusById.scrape).toBe("complete");
    expect(statusById.customize).toBe("inProgress");
    expect(statusById.apply).toBe("pending");
    expect(statusById.gamify).toBe("pending");
  });
});

describe("dashboard flow action resolver", () => {
  it("prioritizes the first incomplete step for quick actions", () => {
    const pipelineSteps = resolveDashboardPipelineSteps({
      savedJobs: 5,
      appliedJobs: 0,
      resumeCount: 0,
      coverLetterCount: 0,
      automationRuns: 2,
      successfulAutomationRuns: 0,
      mappedSkillsCount: 0,
      gamificationXp: 0,
    });

    const actions = resolveDashboardFlowActions(pipelineSteps);

    expect(actions[0]?.id).toBe("customize");
    expect(actions.length).toBe(4);
  });

  it("switches to advanced actions once the full pipeline is complete", () => {
    const pipelineSteps = resolveDashboardPipelineSteps({
      savedJobs: 3,
      appliedJobs: 2,
      resumeCount: 1,
      coverLetterCount: 1,
      automationRuns: 4,
      successfulAutomationRuns: 2,
      mappedSkillsCount: 5,
      gamificationXp: 320,
    });

    const actions = resolveDashboardFlowActions(pipelineSteps);

    expect(actions[0]?.id).toBe("interview");
    expect(actions[1]?.id).toBe("ai-chat");
    expect(actions.length).toBe(4);
  });
});
