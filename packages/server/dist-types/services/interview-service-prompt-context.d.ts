import type { InterviewConfig, InterviewerPersona } from "@bao/shared/types/interview";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
export declare function buildCandidatePromptContext(candidateContext: CandidateInterviewContext): string;
/**
 * Interviews only describe the posting in job mode — a studio-mode interview must
 * not be steered by a job the user did not target. The studio block itself has no
 * interview-specific rule, so callers use the canonical builder directly.
 */
export declare function buildInterviewJobPromptContext(config: InterviewConfig): string;
export declare function buildInterviewerPersona(studio: StudioContext, config: InterviewConfig): InterviewerPersona;
