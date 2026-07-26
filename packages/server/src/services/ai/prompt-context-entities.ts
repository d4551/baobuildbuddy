import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import { COUNT_EIGHT, COUNT_FOUR, COUNT_SIX } from "@bao/shared/constants/numeric";
import type { InterviewTargetJob } from "@bao/shared/types/interview";
import type { ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import type { SkillMapping } from "@bao/shared/types/skill-mapping";

/**
 * Canonical studio / job / skill prompt context, shared by every AI surface.
 *
 * These builders started out inside the interview service, so interviews were the
 * only surface whose prompts actually described the studio and the scraped job.
 * Cover letters asked the model to "demonstrate knowledge of the company and their
 * games" while being handed nothing but a company name, and resume enhancement had
 * no job at all. Keeping one implementation here means a surface either passes the
 * context or visibly does not — there is no second, thinner copy to drift into.
 */

export interface StudioPromptContext {
  readonly name: string;
  readonly description: string;
  readonly interviewStyle: string;
  readonly technologies: readonly string[];
  readonly games: readonly string[];
  readonly location: string;
  readonly type: string;
  readonly remoteWork: boolean;
  readonly enrichment?: ScrapePersonaEnrichment;
}

const joinOrUnspecified = (values: readonly string[]): string =>
  values.join(", ") || DEFAULT_UNSPECIFIED_LABEL;

const joinSignals = (values: readonly string[] | undefined): string =>
  (values ?? []).join("; ") || DEFAULT_UNSPECIFIED_LABEL;

export function buildStudioPromptContext(studio: StudioPromptContext): string {
  return `Studio context:
- Name: ${studio.name}
- Type: ${studio.type || DEFAULT_UNSPECIFIED_LABEL}
- Interview style: ${studio.interviewStyle || DEFAULT_UNSPECIFIED_LABEL}
- Technologies: ${joinOrUnspecified(studio.technologies)}
- Key titles: ${joinOrUnspecified(studio.games.slice(0, COUNT_FOUR))}
- Remote: ${studio.remoteWork ? "supported" : "primarily on-site"}
- Persona summary: ${studio.enrichment?.summary || DEFAULT_UNSPECIFIED_LABEL}
- Hiring signals: ${joinSignals(studio.enrichment?.hiringSignals)}
- Interview focus areas: ${joinSignals(studio.enrichment?.interviewFocusAreas)}
- Candidate pitch angles: ${joinSignals(studio.enrichment?.candidatePitchAngles)}`;
}

/** Absent job context is stated explicitly so the model never invents a posting. */
export const JOB_CONTEXT_NOT_PROVIDED = "Job context: not provided.";

export function buildJobPromptContext(job: InterviewTargetJob | null | undefined): string {
  if (!job) {
    return JOB_CONTEXT_NOT_PROVIDED;
  }

  return `Job context:
- Job title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Technologies: ${joinOrUnspecified(job.technologies ?? [])}
- Requirements: ${joinSignals(job.requirements?.slice(0, COUNT_EIGHT))}
- Description: ${job.description || "Not provided"}
- Source: ${job.source || "Unknown"}
- Persona summary: ${job.enrichment?.summary || DEFAULT_UNSPECIFIED_LABEL}
- Hiring signals: ${joinSignals(job.enrichment?.hiringSignals)}
- Interview focus areas: ${joinSignals(job.enrichment?.interviewFocusAreas)}
- Candidate pitch angles: ${joinSignals(job.enrichment?.candidatePitchAngles)}`;
}

/** Absent skill context is stated explicitly for the same reason as job context. */
export const SKILL_CONTEXT_NOT_PROVIDED = "Transferable skill context: not provided.";

/**
 * Renders the candidate's game-to-industry skill translations. Highest-confidence
 * mappings first, because prompt budget is finite and a low-confidence mapping is
 * the one most likely to mislead the model.
 */
export function buildSkillPromptContext(skills: readonly SkillMapping[]): string {
  if (skills.length === 0) {
    return SKILL_CONTEXT_NOT_PROVIDED;
  }

  const ranked = [...skills]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, COUNT_SIX);

  const lines = ranked.map(
    (skill) =>
      `- ${skill.gameExpression} → ${skill.transferableSkill} (${skill.category}, demand ${skill.demandLevel}, confidence ${String(skill.confidence)}): ${joinOrUnspecified(skill.industryApplications)}`,
  );

  return `Transferable skill context:
${lines.join("\n")}`;
}
