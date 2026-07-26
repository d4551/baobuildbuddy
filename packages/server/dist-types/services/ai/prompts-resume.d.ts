/**
 * Resume enhancement prompt.
 *
 * Takes a named context object rather than positional strings. The previous
 * signature was `(resume, jobDescription?)`, and the route called it with the
 * requested *section* in the second slot — so the prompt told the model the target
 * job description was literally "all". Named fields make that class of mix-up
 * impossible and let the caller supply real studio / job / skill context.
 */
export interface ResumeEnhancePromptContext {
    readonly resume: string;
    /** Which resume section to focus on, e.g. "summary" or "all". */
    readonly section: string;
    readonly jobContext?: string;
    readonly studioContext?: string;
    readonly skillContext?: string;
}
export declare function resumeEnhancePrompt(context: ResumeEnhancePromptContext): string;
/**
 * Resume scoring prompt
 */
export declare function resumeScorePrompt(resume: string, jobDescription: string): string;
/**
 * Cover letter generation prompt.
 *
 * Instruction 3 asks the model to demonstrate knowledge of the company and its
 * games. That was previously unbacked: the caller passed a company *name* and a
 * free-form `jobInfo` blob, never the scraped studio record or the scraped posting,
 * so the model had to invent the specifics it was told to demonstrate. The context
 * fields below are the studio / job / skill blocks built by
 * `prompt-context-entities.ts`.
 */
export interface CoverLetterPromptContext {
    readonly company: string;
    readonly position: string;
    readonly jobInfo: string;
    readonly resumeContext: string;
    readonly jobContext?: string;
    readonly studioContext?: string;
    readonly skillContext?: string;
}
export declare function coverLetterPrompt(context: CoverLetterPromptContext): string;
