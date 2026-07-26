import type { InterviewPersonaPromptInput } from "./prompt-contracts";

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
 * Interview persona prompt for AI roleplaying as interviewer
 */
export function interviewPersonaPrompt({
  role,
  company,
  personality,
  interviewStyle,
  focusAreas,
}: InterviewPersonaPromptInput): string {
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
