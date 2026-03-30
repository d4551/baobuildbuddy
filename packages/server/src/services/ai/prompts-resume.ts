/**
 * Resume enhancement prompt
 */
export function resumeEnhancePrompt(resume: string, jobDescription?: string): string {
  return `Analyze this resume and suggest improvements to make it more effective for game industry positions.

Resume:
${resume}

${jobDescription ? `Target Job Description:\n${jobDescription}\n\n` : ""}

Provide specific suggestions for:
1. Strengthening bullet points with quantifiable achievements
2. Highlighting relevant gaming industry skills and technologies
3. Optimizing keywords for ATS (Applicant Tracking Systems)
4. Improving action verbs and impact statements
5. Better showcasing game projects, shipped titles, or relevant experience

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
 * Cover letter generation prompt
 */
export function coverLetterPrompt(
  company: string,
  position: string,
  jobInfo: string,
  resumeContext: string,
): string {
  return `Write a compelling cover letter for this game industry position.

Position: ${position}
Company: ${company}

Job Information:
${jobInfo}

${resumeContext ? `Candidate Background:\n${resumeContext}` : ""}

Create a cover letter that:
1. Shows genuine enthusiasm for the role and company
2. Highlights 2-3 most relevant experiences or achievements
3. Demonstrates knowledge of the company and their games/products
4. Explains why this role is a great fit for the candidate's career goals
5. Maintains a professional but passionate tone appropriate for gaming

Respond with a JSON object containing three fields: introduction (string), body (string), conclusion (string).

Keep it concise (3-4 paragraphs, under 400 words) and engaging.`;
}

/**
 * Resume bullet quantification prompt
 */
export function resumeQuantifyPrompt(
  bulletPoint: string,
  sectionType: string,
  jobContext?: string,
): string {
  return `Improve this resume bullet point by adding concrete metrics and quantifiable achievements.

Bullet Point: ${bulletPoint}
Section: ${sectionType}
${jobContext ? `Job Context: ${jobContext}` : ""}

Provide 3 improved variations that:
1. Include specific numbers, percentages, or metrics
2. Use strong action verbs relevant to gaming industry
3. Show impact and results, not just responsibilities
4. Follow the format: [Action Verb] + [What] + [Quantified Result]

Return as JSON: { "variations": [string, string, string], "tips": string }`;
}

/**
 * Cover letter customization for company culture
 */
export function coverLetterCustomizePrompt(
  template: string,
  company: string,
  culture: string[],
  relevantExperience: string,
): string {
  return `Customize this cover letter template to match the company's culture and tone.

Template:
${template}

Company: ${company}
Culture Keywords: ${culture.join(", ")}
Relevant Experience: ${relevantExperience}

Adapt the letter to:
1. Match the company's communication style (formal vs casual)
2. Reference specific cultural values naturally
3. Highlight the most relevant experience for this company
4. Maintain authenticity while showing cultural alignment
5. Keep it concise (3-4 paragraphs, under 400 words)

Return the customized cover letter text.`;
}
