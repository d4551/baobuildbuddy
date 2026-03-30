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

/**
 * Portfolio review prompt
 */
export function portfolioReviewPrompt(portfolioDescription: string, targetRole: string): string {
  return `Review this portfolio for a game industry ${targetRole} position.

Portfolio Description:
${portfolioDescription}

Target Role: ${targetRole}

Evaluate and provide feedback on:
1. Relevance: How well does it showcase skills for this role
2. Presentation: Quality of presentation and organization
3. Variety: Range of projects and skills demonstrated
4. Depth: Technical depth and problem-solving shown
5. Impact: Evidence of results and contributions
6. Missing Pieces: What should be added for this role
7. Standout Elements: What makes this portfolio memorable
8. Next Steps: Top 3 improvements to prioritize

Provide specific, actionable advice for strengthening the portfolio.`;
}

/**
 * Company research prompt
 */
export function companyResearchPrompt(companyName: string): string {
  return `Provide key information about ${companyName} for a job candidate.

Include:
1. Company Overview: Type of studio (AAA, indie, mobile, etc.)
2. Notable Games: Key titles they've developed or published
3. Company Culture: What's known about their work environment
4. Recent News: Recent releases, announcements, or developments
5. Interview Tips: What they typically look for in candidates
6. Application Advice: How to stand out when applying
7. Red Flags or Green Flags: What candidates should know

Focus on practical information useful for job seekers.`;
}

/**
 * Salary negotiation guidance prompt
 */
export function salaryNegotiationPrompt(
  role: string,
  level: string,
  location: string,
  offer?: number,
): string {
  const offerText = offer ? `\n\nCurrent Offer: $${offer.toLocaleString()}` : "";

  return `Provide salary negotiation guidance for a game industry position.

Role: ${role}
Level: ${level}
Location: ${location}${offerText}

Provide:
1. Market Range: Typical salary range for this role/level/location
2. Total Compensation: What else to consider (equity, bonus, benefits)
3. Negotiation Strategy: How to approach the conversation
4. Key Talking Points: What to emphasize in negotiations
5. Non-Salary Perks: Other valuable items to negotiate
6. Red Lines: When to walk away vs. when to compromise
7. Next Steps: Concrete actions to take

Be realistic about game industry compensation while empowering the candidate.`;
}

/**
 * Career transition prompt
 */
export function careerTransitionPrompt(
  currentField: string,
  targetRole: string,
  transferableSkills: string[],
): string {
  return `Help someone transition from ${currentField} into ${targetRole} in the game industry.

Current Field: ${currentField}
Target Role: ${targetRole}
Transferable Skills: ${transferableSkills.join(", ")}

Provide a transition roadmap:
1. Skill Gap Analysis: What new skills are needed
2. Transferable Skills: How to position current skills for gaming
3. Learning Path: Recommended courses, tutorials, resources
4. Portfolio Projects: Projects to build gaming-relevant portfolio
5. Networking Strategy: How to break into the game industry
6. Application Strategy: How to address the career change
7. Timeline: Realistic timeframe for this transition
8. Success Stories: Examples of similar successful transitions

Be encouraging but realistic about the challenges and opportunities.`;
}

/**
 * Portfolio project description generator
 */
export function portfolioDescriptionPrompt(
  title: string,
  technologies: string[],
  role: string,
  outcomes?: string,
): string {
  return `Write a compelling portfolio project description for a game industry professional.

Project Title: ${title}
Technologies Used: ${technologies.join(", ")}
Role: ${role}
${outcomes ? `Outcomes/Results: ${outcomes}` : ""}

Create a description that:
1. Opens with the project's purpose and impact (1 sentence)
2. Explains the technical challenges and how they were solved
3. Highlights the candidate's specific contributions
4. Mentions technologies naturally within context
5. Ends with measurable outcomes or lessons learned
6. Is 3-4 sentences, professional but engaging

Return the description text.`;
}

/**
 * Skill gap analysis prompt
 */
export function skillGapPrompt(
  userSkills: string[],
  targetRole: string,
  targetCompany?: string,
): string {
  return `Analyze skill gaps for a candidate targeting a game industry position.

Current Skills: ${userSkills.join(", ")}
Target Role: ${targetRole}
${targetCompany ? `Target Company: ${targetCompany}` : ""}

Provide a detailed gap analysis:
1. Matched Skills: Which current skills directly apply
2. Partial Matches: Skills that need deepening or updating
3. Missing Critical Skills: Must-have skills not present
4. Nice-to-Have Gaps: Optional but valuable skills missing
5. Learning Resources: Specific courses, tutorials, or projects for each gap
6. Priority Order: Which gaps to address first for maximum impact
7. Timeline: Realistic estimate to close critical gaps

Return as JSON: {
  "matched": [{ "skill": string, "relevance": string }],
  "partial": [{ "skill": string, "gap": string, "action": string }],
  "missing": [{ "skill": string, "importance": "critical"|"high"|"medium", "resource": string }],
  "timeline": string,
  "readinessScore": number
}`;
}

/**
 * Skill categorization prompt for gaming-to-career mapping
 */
export function skillCategorizePrompt(gamingExperiences: string[]): string {
  return `Map these gaming experiences to professional transferable skills with evidence.

Gaming Experiences:
${gamingExperiences.map((exp, i) => `${i + 1}. ${exp}`).join("\n")}

For each gaming experience, identify:
1. The transferable professional skill it demonstrates
2. The industry application (which careers value this skill)
3. How to articulate this in a resume or interview
4. Confidence level (how strongly this maps to the professional skill)

Return as JSON: {
  "mappings": [{
    "gaming": string,
    "professional": string,
    "applications": string[],
    "resumePhrase": string,
    "confidence": number
  }]
}`;
}
