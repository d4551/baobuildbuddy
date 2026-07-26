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
export declare function buildStudioPromptContext(studio: StudioPromptContext): string;
/** Absent job context is stated explicitly so the model never invents a posting. */
export declare const JOB_CONTEXT_NOT_PROVIDED = "Job context: not provided.";
export declare function buildJobPromptContext(job: InterviewTargetJob | null | undefined): string;
/** Absent skill context is stated explicitly for the same reason as job context. */
export declare const SKILL_CONTEXT_NOT_PROVIDED = "Transferable skill context: not provided.";
/**
 * Renders the candidate's game-to-industry skill translations. Highest-confidence
 * mappings first, because prompt budget is finite and a low-confidence mapping is
 * the one most likely to mislead the model.
 */
export declare function buildSkillPromptContext(skills: readonly SkillMapping[]): string;
