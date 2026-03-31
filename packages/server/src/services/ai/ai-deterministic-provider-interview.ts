import { DECIMAL_RADIX } from "@bao/shared";

const TEST_AI_MAX_QUESTION_COUNT = 12;
const EXACT_QUESTION_COUNT_PATTERN = /exactly\s+(\d+)\s+questions/i;
const GENERATE_QUESTION_COUNT_PATTERN = /generate\s+(\d+)\s+interview questions/i;
const SUMMARY_BULLET_PATTERN_TEMPLATE = String.raw`^-\s+%LABEL%:\s*(.+)$`;
const PROMPT_HIGHLIGHT_SPLIT_PATTERN = /[;,]/u;

type DeterministicInterviewQuestionType =
  | "intro"
  | "behavioral"
  | "technical"
  | "studio-specific"
  | "closing";

type DeterministicInterviewPromptContext = {
  studio: string;
  role: string;
  company: string;
  experienceHighlight: string;
  projectHighlight: string;
  technicalHighlight: string;
  focusArea: string;
  hiringSignal: string;
  pitchAngle: string;
};

const parseQuestionCount = (prompt: string): number => {
  const exactMatch = prompt.match(EXACT_QUESTION_COUNT_PATTERN);
  const generateMatch = prompt.match(GENERATE_QUESTION_COUNT_PATTERN);
  const matchedValue = exactMatch?.[1] ?? generateMatch?.[1];
  const parsed = matchedValue ? Number.parseInt(matchedValue, DECIMAL_RADIX) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 3;
  }
  return Math.min(parsed, TEST_AI_MAX_QUESTION_COUNT);
};

const parseIncludeFlag = (prompt: string, label: string, fallback: boolean): boolean => {
  const matcher = new RegExp(`${label}\\s*=\\s*(true|false)`, "i");
  const matched = prompt.match(matcher)?.[1];
  if (matched === "true") return true;
  if (matched === "false") return false;
  return fallback;
};

const escapePattern = (value: string): string =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const extractPromptLineValue = (prompt: string, label: string): string => {
  const matcher = new RegExp(`^${escapePattern(label)}:\\s*(.+)$`, "im");
  return prompt.match(matcher)?.[1]?.trim() ?? "";
};

const extractPromptBulletValue = (prompt: string, label: string): string => {
  const pattern = SUMMARY_BULLET_PATTERN_TEMPLATE.replace("%LABEL%", escapePattern(label));
  return prompt.match(new RegExp(pattern, "im"))?.[1]?.trim() ?? "";
};

const extractPromptHighlights = (value: string): string[] =>
  value
    .split(PROMPT_HIGHLIGHT_SPLIT_PATTERN)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.toLowerCase() !== "not specified")
    .slice(0, 3);

const buildPromptContext = (prompt: string): DeterministicInterviewPromptContext => {
  const studio =
    extractPromptLineValue(prompt, "Studio") || extractPromptBulletValue(prompt, "Name");
  const role =
    extractPromptLineValue(prompt, "Role") || extractPromptBulletValue(prompt, "Job title");
  const company = extractPromptBulletValue(prompt, "Company") || studio;
  const experienceHighlights = extractPromptHighlights(
    extractPromptBulletValue(prompt, "Experience highlights") ||
      extractPromptBulletValue(prompt, "Current role"),
  );
  const projectHighlights = extractPromptHighlights(
    extractPromptBulletValue(prompt, "Project highlights") ||
      extractPromptBulletValue(prompt, "Featured work"),
  );
  const technicalHighlights = extractPromptHighlights(
    extractPromptBulletValue(prompt, "Technical skills") ||
      extractPromptBulletValue(prompt, "Technologies"),
  );
  const focusAreas = extractPromptHighlights(
    extractPromptBulletValue(prompt, "Interview focus areas"),
  );
  const hiringSignals = extractPromptHighlights(extractPromptBulletValue(prompt, "Hiring signals"));
  const candidatePitchAngles = extractPromptHighlights(
    extractPromptBulletValue(prompt, "Candidate pitch angles"),
  );

  return {
    studio,
    role,
    company,
    experienceHighlight: experienceHighlights[0] ?? "recent game-industry delivery work",
    projectHighlight: projectHighlights[0] ?? "a player-facing system you shipped",
    technicalHighlight: technicalHighlights[0] ?? "your strongest technical stack",
    focusArea: focusAreas[0] ?? "cross-functional delivery",
    hiringSignal: hiringSignals[0] ?? "shipping velocity and collaborative execution",
    pitchAngle: candidatePitchAngles[0] ?? "player impact, ownership, and measurable outcomes",
  };
};

const buildQuestionText = (
  type: DeterministicInterviewQuestionType,
  context: DeterministicInterviewPromptContext,
): string => {
  switch (type) {
    case "intro":
      return `Your background highlights ${context.experienceHighlight}. How does that prepare you for the ${context.role} role at ${context.company}?`;
    case "behavioral":
      return `Tell me about a time you aligned design, production, or QA partners to deliver ${context.focusArea} work with clear player impact.`;
    case "technical":
      return `Walk me through a system from ${context.projectHighlight} where you used ${context.technicalHighlight} in a way that would transfer directly to the ${context.role} scope at ${context.company}.`;
    case "studio-specific":
      return `This opportunity signals ${context.hiringSignal}. How would you ramp up in your first 30 days and prove the ${context.pitchAngle} angle is real?`;
    case "closing":
      return `What is the strongest evidence from your resume, cover letter, or portfolio that you are ready for ${context.role} at ${context.company} right now?`;
  }
};

const buildFollowUps = (
  type: DeterministicInterviewQuestionType,
  context: DeterministicInterviewPromptContext,
): string[] => {
  switch (type) {
    case "intro":
      return [
        `Which result from ${context.projectHighlight} is most relevant to ${context.company}?`,
        "How did you validate the outcome with teammates or players?",
      ];
    case "behavioral":
      return [
        "What disagreement or tradeoff made the collaboration difficult?",
        "How did you know the partnership was working?",
      ];
    case "technical":
      return [
        `What constraints shaped your use of ${context.technicalHighlight}?`,
        "What telemetry or quality checks told you the solution was healthy?",
      ];
    case "studio-specific":
      return [
        `Which stakeholder would you meet first to support ${context.focusArea}?`,
        "What deliverable would you aim to own by the end of the first sprint?",
      ];
    case "closing":
      return [
        "Which accomplishment best proves that claim?",
        "Why does this studio context fit where you want to grow next?",
      ];
  }
};

export const buildDeterministicQuestionSet = (prompt: string): string => {
  const questionCount = parseQuestionCount(prompt);
  const includeTechnical = parseIncludeFlag(prompt, "technical", true);
  const includeBehavioral = parseIncludeFlag(prompt, "behavioral", true);
  const includeStudioSpecific = parseIncludeFlag(prompt, "studio-specific", true);
  const promptContext = buildPromptContext(prompt);
  const candidateTypes: DeterministicInterviewQuestionType[] = ["intro"];
  if (includeBehavioral) {
    candidateTypes.push("behavioral");
  }
  if (includeTechnical) {
    candidateTypes.push("technical");
  }
  if (includeStudioSpecific) {
    candidateTypes.push("studio-specific");
  }
  candidateTypes.push("closing");

  const questions = [];
  for (let index = 0; index < questionCount; index += 1) {
    const position = index + 1;
    const type = candidateTypes[index % candidateTypes.length] ?? "behavioral";
    questions.push({
      id: `test-q${position}`,
      question: buildQuestionText(type, promptContext),
      type,
      followUps: buildFollowUps(type, promptContext),
      expectedDuration: 90,
      difficulty: type === "technical" ? "hard" : "medium",
      tags: ["deterministic", "test"],
    });
  }

  return JSON.stringify(questions);
};
