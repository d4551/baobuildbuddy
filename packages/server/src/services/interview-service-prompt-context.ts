import type { InterviewConfig, InterviewerPersona } from "@bao/shared/types/interview";
import { buildJobPromptContext, JOB_CONTEXT_NOT_PROVIDED } from "./ai/prompt-context-entities";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";

export function buildCandidatePromptContext(candidateContext: CandidateInterviewContext): string {
  return `${candidateContext.profileSummary}

${candidateContext.resumeSummary}

${candidateContext.coverLetterSummary}

${candidateContext.portfolioSummary}

Conversation style: ${candidateContext.conversationStyle}`;
}

/**
 * Interviews only describe the posting in job mode — a studio-mode interview must
 * not be steered by a job the user did not target. The studio block itself has no
 * interview-specific rule, so callers use the canonical builder directly.
 */
export function buildInterviewJobPromptContext(config: InterviewConfig): string {
  if (config.interviewMode !== "job") {
    return JOB_CONTEXT_NOT_PROVIDED;
  }
  return buildJobPromptContext(config.targetJob);
}

export function buildInterviewerPersona(
  studio: StudioContext,
  config: InterviewConfig,
): InterviewerPersona {
  const level = config.experienceLevel.replace("level", "").trim() || "experienced";
  const targetJob = config.targetJob;
  const personaStudioName =
    config.interviewMode === "job" && targetJob?.company ? targetJob.company : studio.name;
  const personaRole = targetJob?.title || config.roleType;

  return {
    name: `${studio.type} Interview Lead`,
    role: `${level} ${personaRole} interviewer`,
    studioName: personaStudioName,
    background: studio.description,
    style: studio.interviewStyle,
    experience: `${studio.location} / ${studio.type}`,
  };
}
