/**
 * Loads the studio / job / skill blocks an AI surface needs, from ids.
 *
 * Cover letters and resume enhancement previously had no way to reach this data —
 * they only received whatever the client hand-marshalled — so their prompts were
 * blind to the scraped studios and postings sitting in the database. Unlike the
 * interview loader (`interview-service-context.ts:resolveStudioContext`) this one
 * does NOT substitute a fallback studio: for a cover letter, a missing studio must
 * read as "no studio context" rather than quietly describing a different company.
 */
export interface EntityPromptContext {
    readonly studioContext?: string;
    readonly jobContext?: string;
    readonly skillContext?: string;
}
export interface EntityPromptContextRequest {
    readonly jobId?: string | undefined;
    readonly studioId?: string | undefined;
    readonly includeSkills?: boolean;
}
export declare const loadEntityPromptContext: (request: EntityPromptContextRequest) => Promise<EntityPromptContext>;
/**
 * Flattens an entity context into a single prompt block. Returns undefined when
 * no context is present so callers can skip the section entirely.
 */
export declare const serializeEntityPromptContext: (context: EntityPromptContext) => string | undefined;
