/**
 * Email response generation prompt for automation email workflows.
 */
export function emailResponsePrompt(
  subject: string,
  message: string,
  tone: "professional" | "friendly" | "concise",
  sender?: string,
): string {
  const senderContext = sender ? `Sender: ${sender}\n` : "";
  return `Draft a ${tone} email response for a career-assistant workflow.

${senderContext}Subject: ${subject}
Incoming message:
${message}

Requirements:
1. Keep the response concise and directly actionable.
2. Preserve important context from the incoming message.
3. Use a ${tone} tone throughout.
4. Do not invent facts, names, or commitments not present in the message.
5. Return only the reply body text with no markdown or analysis.`;
}

/**
 * Job match analysis prompt
 */
export function jobMatchPrompt(
  userProfile: { skills: string[]; experience: string; goals: string },
  job: { title: string; company: string; description: string; requirements: string[] },
): string {
  return `Analyze how well this candidate matches this game industry job opportunity.

Candidate Profile:
Skills: ${userProfile.skills.join(", ")}
Experience: ${userProfile.experience}
Career Goals: ${userProfile.goals}

Job Opportunity:
Position: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${job.requirements.join(", ")}

Provide:
1. Match Score (0-100)
2. Key Strengths: Why they're a good fit
3. Potential Concerns: What might be challenging
4. Skills to Highlight: Which of their skills to emphasize
5. Preparation Tips: What to focus on before applying
6. Growth Potential: How this role aligns with their career goals

Be realistic but encouraging in your assessment.`;
}

/**
 * Skills analysis and mapping prompt
 */
export function skillAnalysisPrompt(skills: string[]): string {
  return `Analyze these skills in the context of game industry careers.

Skills: ${skills.join(", ")}

Provide:
1. Career Paths: Which game industry roles match these skills
2. Skill Categorization: Technical, creative, soft skills, etc.
3. Market Demand: How in-demand are these skills in gaming
4. Complementary Skills: What additional skills would be valuable
5. Standout Skills: Which skills are particularly impressive or rare
6. Portfolio Projects: Suggested projects to showcase these skills
7. Learning Path: Recommendations for skill development

Focus on actionable insights for game industry job seekers.`;
}
