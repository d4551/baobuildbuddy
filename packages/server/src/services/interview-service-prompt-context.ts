import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import type { InterviewConfig, InterviewerPersona } from "@bao/shared/types/interview";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";

export function buildCandidatePromptContext(candidateContext: CandidateInterviewContext): string {
  return `${candidateContext.profileSummary}

${candidateContext.resumeSummary}

${candidateContext.coverLetterSummary}

${candidateContext.portfolioSummary}

Conversation style: ${candidateContext.conversationStyle}`;
}

export function buildStudioPromptContext(studio: StudioContext): string {
  return `Studio context:
- Name: ${studio.name}
- Type: ${studio.type || DEFAULT_UNSPECIFIED_LABEL}
- Interview style: ${studio.interviewStyle || DEFAULT_UNSPECIFIED_LABEL}
- Technologies: ${studio.technologies.join(", ") || DEFAULT_UNSPECIFIED_LABEL}
- Key titles: ${studio.games.slice(0, 4).join(", ") || DEFAULT_UNSPECIFIED_LABEL}
- Remote: ${studio.remoteWork ? "supported" : "primarily on-site"}
- Persona summary: ${studio.enrichment?.summary || DEFAULT_UNSPECIFIED_LABEL}
- Hiring signals: ${studio.enrichment?.hiringSignals.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Interview focus areas: ${studio.enrichment?.interviewFocusAreas.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Candidate pitch angles: ${studio.enrichment?.candidatePitchAngles.join("; ") || DEFAULT_UNSPECIFIED_LABEL}`;
}

export function buildJobPromptContext(config: InterviewConfig): string {
  const targetJob = config.targetJob;
  if (!targetJob || config.interviewMode !== "job") {
    return "Job context: not provided.";
  }

  return `Job context:
- Job title: ${targetJob.title}
- Company: ${targetJob.company}
- Location: ${targetJob.location}
- Technologies: ${targetJob.technologies?.join(", ") || DEFAULT_UNSPECIFIED_LABEL}
- Requirements: ${targetJob.requirements?.slice(0, 8).join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Description: ${targetJob.description || "Not provided"}
- Source: ${targetJob.source || "Unknown"}
- Persona summary: ${targetJob.enrichment?.summary || DEFAULT_UNSPECIFIED_LABEL}
- Hiring signals: ${targetJob.enrichment?.hiringSignals.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Interview focus areas: ${targetJob.enrichment?.interviewFocusAreas.join("; ") || DEFAULT_UNSPECIFIED_LABEL}
- Candidate pitch angles: ${targetJob.enrichment?.candidatePitchAngles.join("; ") || DEFAULT_UNSPECIFIED_LABEL}`;
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
