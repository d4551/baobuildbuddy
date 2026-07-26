import type { InterviewPersonaPromptInput } from "./prompt-contracts";
/**
 * Interview question generation prompt
 */
export declare function interviewQuestionPrompt(studio: string, role: string, level: "entry" | "mid" | "senior" | "lead"): string;
/**
 * Interview response feedback prompt
 */
export declare function interviewFeedbackPrompt(question: string, response: string): string;
/**
 * Interview persona prompt for AI roleplaying as interviewer
 */
export declare function interviewPersonaPrompt({ role, company, personality, interviewStyle, focusAreas, }: InterviewPersonaPromptInput): string;
