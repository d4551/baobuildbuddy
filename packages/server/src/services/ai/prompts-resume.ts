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

export function resumeEnhancePrompt(context: ResumeEnhancePromptContext): string {
  const supportingContext = [context.jobContext, context.studioContext, context.skillContext]
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .join("\n\n");

  return `Analyze this resume and suggest improvements to make it more effective for game industry positions.

Resume:
${context.resume}

Focus section: ${context.section}

${supportingContext}

Provide specific suggestions for:
1. Strengthening bullet points with quantifiable achievements
2. Highlighting relevant gaming industry skills and technologies
3. Optimizing keywords for ATS (Applicant Tracking Systems)
4. Improving action verbs and impact statements
5. Better showcasing game projects, shipped titles, or relevant experience

Ground every suggestion in the supplied job, studio and skill context when present;
do not invent employer details that were not provided.

Format your response with clear sections and actionable recommendations.`;
}

/**
 * Resume scoring prompt
 */
export function resumeScorePrompt(resume: string, jobDescription: string): string {
  return `Score this resume against the job description for a game industry position. Provide a match score from 0-100 and detailed feedback.

Job Description:
${jobDescription}

Resume:
${resume}

Analyze and provide:
1. Overall Match Score (0-100)
2. Skills Match: Which required skills are present/missing
3. Experience Alignment: How well does experience match requirements
4. Keywords: Important ATS keywords present or missing
5. Strengths: What makes this candidate compelling
6. Gaps: What's missing or could be improved
7. Recommendations: Top 3 changes to improve the match

Be honest but constructive in your assessment.`;
}

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

export function coverLetterPrompt(context: CoverLetterPromptContext): string {
  const supportingContext = [context.studioContext, context.jobContext, context.skillContext]
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .join("\n\n");

  return `Write a compelling cover letter for this game industry position.

Position: ${context.position}
Company: ${context.company}

Job Information:
${context.jobInfo}

${supportingContext}

${context.resumeContext ? `Candidate Background:\n${context.resumeContext}` : ""}

Create a cover letter that:
1. Shows genuine enthusiasm for the role and company
2. Highlights 2-3 most relevant experiences or achievements
3. Demonstrates knowledge of the company and their games/products, using only the
   studio and job context supplied above — never invent titles, technologies or
   values that were not provided
4. Explains why this role is a great fit for the candidate's career goals
5. Maintains a professional but passionate tone appropriate for gaming

Respond with a JSON object containing three fields: introduction (string), body (string), conclusion (string).

Keep it concise (3-4 paragraphs, under 400 words) and engaging.`;
}
