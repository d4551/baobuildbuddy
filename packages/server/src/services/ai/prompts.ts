/**
 * AI Prompt Templates for BaoBuildBuddy Career Assistant
 * Specialized for video game industry career guidance
 */

/**
 * Core system prompt defining BaoBuildBuddy's personality and expertise
 */
export const SYSTEM_PROMPT = `You are BaoBuildBuddy, a friendly and knowledgeable AI career assistant specializing in the video game industry. You have a warm, supportive personality inspired by helpful fairy companions in games.

Your expertise includes:
- Video game industry career paths (development, design, art, production, QA, etc.)
- Major game studios and publishers (AAA, indie, mobile)
- Gaming industry hiring practices and culture
- Technical skills relevant to game development
- Portfolio and resume optimization for gaming careers
- Interview preparation for game industry roles

Your communication style:
- Friendly and encouraging, but professional
- Use gaming references naturally when appropriate
- Be specific and actionable in your advice
- Celebrate achievements and progress
- Acknowledge challenges while staying positive

Remember:
- You're helping people pursue their dreams in gaming
- The game industry values passion, creativity, and continuous learning
- Every person's career journey is unique
- Technical skills matter, but so do soft skills and cultural fit`;

/**
 * Resume enhancement prompt
 */
export function resumeEnhancePrompt(resume: string, jobDescription?: string): string {
  const basePrompt = `Analyze this resume and suggest improvements to make it more effective for game industry positions.

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

  return basePrompt;
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
  resume: string,
  jobInfo: { title: string; company: string; description: string },
): string {
  return `Write a compelling cover letter for this game industry position.

Position: ${jobInfo.title}
Company: ${jobInfo.company}

Job Description:
${jobInfo.description}

Candidate Resume Summary:
${resume}

Create a cover letter that:
1. Shows genuine enthusiasm for the role and company
2. Highlights 2-3 most relevant experiences or achievements
3. Demonstrates knowledge of the company and their games/products
4. Explains why this role is a great fit for the candidate's career goals
5. Maintains a professional but passionate tone appropriate for gaming

Keep it concise (3-4 paragraphs, under 400 words) and engaging.`;
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
 * Interview question generation prompt
 */
export function interviewQuestionPrompt(
  studio: string,
  role: string,
  level: "entry" | "mid" | "senior" | "lead",
): string {
  return `Generate 5 likely interview questions for this game industry position.

Studio: ${studio}
Role: ${role}
Level: ${level}

Include a mix of:
1. Technical/Skills Questions: Specific to the role
2. Behavioral Questions: STAR method scenarios
3. Gaming Industry Questions: Knowledge of games, trends, studio
4. Problem-Solving: Hypothetical challenges in game development
5. Cultural Fit: Values, teamwork, passion for games

For each question, also provide:
- Why this question might be asked
- Key points to cover in a strong answer
- Common pitfalls to avoid

Make questions realistic and relevant to ${level}-level ${role} positions.`;
}

/**
 * Interview response feedback prompt
 */
export function interviewFeedbackPrompt(question: string, response: string): string {
  return `Evaluate this interview response for a game industry position.

Question:
${question}

Candidate's Response:
${response}

Provide:
1. Overall Rating: Strong / Good / Adequate / Needs Work
2. What Worked Well: Positive aspects of the response
3. Areas for Improvement: What could be stronger
4. Missing Elements: Important points not addressed
5. Suggested Improvements: How to enhance this answer
6. Example Response: A model answer incorporating best practices

Be constructive and specific in your feedback.`;
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

/**
 * Interview persona prompt for AI roleplaying as interviewer
 */
export function interviewPersonaPrompt(
  role: string,
  company: string,
  personality: string,
  interviewStyle: string,
  focusAreas: string[],
): string {
  return `You are roleplaying as an interviewer at ${company} for a ${role} position.

Interviewer Personality: ${personality}
Interview Style: ${interviewStyle}
Focus Areas: ${focusAreas.join(", ")}

Stay in character throughout the interview. Your behavior:
1. Ask questions naturally, building on previous answers
2. React to responses with appropriate follow-ups
3. Use the ${interviewStyle} interview style consistently
4. Focus on ${focusAreas.join(" and ")}
5. Be realistic — mix tough questions with rapport-building
6. Provide subtle hints if the candidate struggles

Start with a brief introduction of yourself and the role, then ask your first question.`;
}

/**
 * Interview follow-up question prompt
 */
export function interviewFollowUpPrompt(
  question: string,
  response: string,
  previousQuestions: string[],
): string {
  return `Generate a contextual follow-up interview question based on the candidate's response.

Original Question: ${question}
Candidate's Response: ${response}
Previous Questions Asked: ${previousQuestions.join("; ")}

Create a follow-up that:
1. Digs deeper into something specific they mentioned
2. Tests a different angle of the same competency
3. Avoids repeating topics from previous questions
4. Feels natural and conversational
5. Helps assess the candidate's depth of knowledge

Return as JSON: { "followUp": string, "rationale": string, "competencyTested": string }`;
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

/**
 * CV questionnaire: generate questions based on target role/studio
 */
export function cvQuestionnaireQuestionsPrompt(
  targetRole: string,
  studioName?: string,
  experienceLevel?: string,
): string {
  return `Generate 8-12 interview-style questions to build a CV/resume for a game industry professional.

Target Role: ${targetRole}
${studioName ? `Target Studio: ${studioName}` : ""}
${experienceLevel ? `Experience Level: ${experienceLevel}` : ""}

Generate questions that gather:
1. Personal info: name, contact, location (1-2 questions)
2. Professional summary / career goals (1-2 questions)
3. Work experience: roles, companies, achievements, technologies (2-3 questions)
4. Education: degree, school, field, relevant coursework (1-2 questions)
5. Skills: technical, soft, gaming-specific (1-2 questions)
6. Projects: shipped titles, side projects, contributions (1-2 questions)
7. Gaming experience: engines, genres, achievements, passion (1-2 questions)

Return a JSON array: [{"id": "q1", "question": "...", "category": "personal"|"summary"|"experience"|"education"|"skills"|"projects"|"gaming"}]`;
}

/**
 * CV questionnaire: synthesize answers into ResumeData JSON
 */
export function cvQuestionnaireSynthesizePrompt(
  questionsAndAnswers: Array<{ id: string; question: string; answer: string; category: string }>,
): string {
  const qaText = questionsAndAnswers
    .map((qa) => `Q (${qa.category}): ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  return `Synthesize these Q&A responses into a structured resume (ResumeData) JSON object.

Questions and Answers:
${qaText}

Return ONLY valid JSON matching this structure (use null/undefined for missing fields):
{
  "personalInfo": {"name": string, "email": string, "phone": string, "location": string, "linkedIn": string, "portfolio": string},
  "summary": string,
  "experience": [{"title": string, "company": string, "startDate": string, "endDate": string, "location": string, "description": string, "achievements": string[]}],
  "education": [{"degree": string, "field": string, "school": string, "year": string, "gpa": string}],
  "skills": {"technical": string[], "soft": string[], "gaming": string[]},
  "projects": [{"title": string, "description": string, "technologies": string[], "link": string}],
  "gamingExperience": {"gameEngines": string, "platforms": string, "genres": string, "shippedTitles": string}
}

Extract and structure all information from the answers. Use empty arrays/objects for missing sections. Return only the JSON, no markdown.`;
}

/**
 * Domain-specific system prompts for contextual AI conversations
 */
export const DOMAIN_SYSTEM_PROMPTS: Record<string, string> = {
  resume:
    "You are BaoBuildBuddy's resume specialist. You have deep expertise in gaming industry resume formatting, ATS optimization, and translating game development experience into compelling bullet points. Focus on quantifiable achievements and industry-specific terminology.",
  interview:
    "You are BaoBuildBuddy's interview coach for gaming industry positions. You understand studio culture, technical interview patterns, and behavioral question frameworks used by major game studios. Provide actionable feedback and realistic practice scenarios.",
  portfolio:
    "You are BaoBuildBuddy's portfolio advisor for gaming professionals. You understand what hiring managers and art directors look for in game dev portfolios, including project presentation, technical depth, and storytelling through work samples.",
  career:
    "You are BaoBuildBuddy's career strategist for the gaming industry. You have knowledge of career paths, salary ranges, studio cultures, and industry trends. Help users make informed decisions about their career trajectory in gaming.",
  general:
    "You are BaoBuildBuddy, a friendly AI career assistant specializing in the video game industry. You combine deep gaming industry knowledge with career coaching expertise. Be encouraging, specific, and actionable in your guidance.",
};

/**
 * Gaming industry context constant for prompt injection
 */
export const GAMING_INDUSTRY_CONTEXT = `Gaming Industry Context:
Engines: Unity, Unreal Engine 5, Godot 4, CryEngine, id Tech, Frostbite, Source 2, RPG Maker, GameMaker, Ren'Py
Platforms: PC (Steam/Epic), PlayStation 5, Xbox Series X|S, Nintendo Switch, Mobile (iOS/Android), VR (Meta Quest/PSVR2), Web (WebGL/HTML5)
Genres: Action, Adventure, RPG, FPS, TPS, Strategy (RTS/TBS), MOBA, Battle Royale, Simulation, Sports, Racing, Fighting, Horror, Puzzle, Platformer, MMO, Sandbox, Visual Novel, Roguelike, Metroidvania, Idle/Clicker
Roles: Game Designer, Level Designer, Systems Designer, Narrative Designer, Gameplay Programmer, Engine Programmer, Graphics Programmer, AI Programmer, Network Programmer, Tools Programmer, Technical Artist, Concept Artist, 3D Modeler, Animator, VFX Artist, Environment Artist, Character Artist, UI/UX Designer, Sound Designer, Music Composer, Producer, Associate Producer, QA Tester, QA Lead, Community Manager, DevOps Engineer, Build Engineer, Localization Specialist, Data Analyst, Live Ops Manager, Monetization Designer
Transferable Skills: Leadership, Project Management, Agile/Scrum, Communication, Problem Solving, Analytics, UX Research, Quality Assurance, Technical Writing, Team Coordination, Deadline Management, Cross-functional Collaboration`;
