import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import { INTERVIEW_DEFAULT_EXPERIENCE_LEVEL } from "@bao/shared/constants/interview";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
} from "@bao/shared/types/interview";
import { interviewPersonaPrompt, interviewQuestionPrompt } from "./ai/prompts-interview";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
import {
  buildCandidatePromptContext,
  buildInterviewerPersona,
  buildJobPromptContext,
  buildStudioPromptContext,
} from "./interview-service-prompt-context";

export function buildQuestionGenerationPrompt(
  studio: StudioContext,
  config: InterviewConfig,
  candidateContext: CandidateInterviewContext,
): string {
  const targetJob = config.targetJob;
  const interviewEntity =
    config.interviewMode === "job" && targetJob?.company ? targetJob.company : studio.name;
  const roleTarget = targetJob?.title || config.roleType;
  const promptLevel =
    config.experienceLevel === "entry" ||
    config.experienceLevel === "mid" ||
    config.experienceLevel === "senior" ||
    config.experienceLevel === "lead"
      ? config.experienceLevel
      : INTERVIEW_DEFAULT_EXPERIENCE_LEVEL;
  const base = interviewQuestionPrompt(interviewEntity, roleTarget, promptLevel);
  const requestedQuestionCount =
    candidateContext.conversationStyle === "natural" ? 1 : config.questionCount;

  return `${base}

Interview mode: ${config.interviewMode || "studio"}
Conversation style: ${candidateContext.conversationStyle}

${buildStudioPromptContext(studio)}

${buildJobPromptContext(config)}

${buildCandidatePromptContext(candidateContext)}

Constraints:
1. Return strict JSON array only.
2. Produce exactly ${requestedQuestionCount} question${requestedQuestionCount === 1 ? "" : "s"}.
3. Use types only from: technical|behavioral|studio-specific|intro|closing.
4. Apply include flags: technical=${config.includeTechnical}, behavioral=${config.includeBehavioral}, studio-specific=${config.includeStudioSpecific}.
5. Keep followUps concise and practical.
6. ExpectedDuration range 45-180.
7. Each question must have: id (string), question (string), type, followUps (array), expectedDuration (number), difficulty, tags (array).
8. Ground every question in the candidate context, not generic interview filler.
9. If conversation style is natural, ask one opening or follow-up question that references the candidate's background and the target role directly.
`;
}

export function buildSimpleQuestionPrompt(role: string, level: string, count: number): string {
  return `Generate ${count} interview questions for a ${level}-level ${role} position in the game industry.
Return a JSON array only. Each object: {"id": "q1", "question": "...", "type": "technical|behavioral|studio-specific", "followUps": [], "expectedDuration": 90, "difficulty": "medium", "tags": []}.`;
}

export function buildNaturalNextQuestionPrompt(input: {
  studio: StudioContext;
  config: InterviewConfig;
  candidateContext: CandidateInterviewContext;
  previousQuestion: InterviewQuestion;
  latestResponse: InterviewResponse;
  responses: InterviewResponse[];
}): string {
  const { studio, config, candidateContext, previousQuestion, latestResponse, responses } = input;

  return `${interviewPersonaPrompt({
    role: config.targetJob?.title || config.roleType,
    company: config.targetJob?.company || studio.name,
    personality: buildInterviewerPersona(studio, config).name,
    interviewStyle: studio.interviewStyle,
    focusAreas: config.focusAreas,
  })}

Interview mode: ${config.interviewMode || "studio"}
Conversation style: ${candidateContext.conversationStyle}
${buildStudioPromptContext(studio)}
${buildJobPromptContext(config)}
${buildCandidatePromptContext(candidateContext)}

Previous question:
${previousQuestion.question}

Latest candidate response:
${latestResponse.transcript}

Interview transcript so far:
${responses.map((response) => `- ${response.questionId}: ${response.transcript}`).join("\n") || `- ${DEFAULT_UNSPECIFIED_LABEL}`}

Return strict JSON only for the single best next question:
{
  "id": "q-next",
  "question": "string",
  "type": "technical|behavioral|studio-specific|intro|closing",
  "followUps": ["string"],
  "expectedDuration": 45-180,
  "difficulty": "easy|medium|hard",
  "tags": ["string"]
}

Constraints:
1. Ask exactly one follow-up question.
2. The question must build on the candidate's previous answer and candidate artifacts.
3. Avoid repeating previous questions.
4. Keep it conversational, specific, and role-relevant.`;
}
