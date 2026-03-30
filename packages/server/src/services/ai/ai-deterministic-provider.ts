import type { AIProviderType, AIResponse } from "@bao/shared";
import { DECIMAL_RADIX } from "@bao/shared";
import type { AIProvider } from "./provider-interface";

export const TEST_AI_PROVIDER_NAME: AIProviderType = "local";
export const TEST_AI_MODEL_NAME = "deterministic-test-model";
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

function parseQuestionCount(prompt: string): number {
  const exactMatch = prompt.match(EXACT_QUESTION_COUNT_PATTERN);
  const generateMatch = prompt.match(GENERATE_QUESTION_COUNT_PATTERN);
  const matchedValue = exactMatch?.[1] ?? generateMatch?.[1];
  const parsed = matchedValue ? Number.parseInt(matchedValue, DECIMAL_RADIX) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 3;
  }
  return Math.min(parsed, TEST_AI_MAX_QUESTION_COUNT);
}

function parseIncludeFlag(prompt: string, label: string, fallback: boolean): boolean {
  const matcher = new RegExp(`${label}\\s*=\\s*(true|false)`, "i");
  const matched = prompt.match(matcher)?.[1];
  if (matched === "true") return true;
  if (matched === "false") return false;
  return fallback;
}

function escapePattern(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function extractPromptLineValue(prompt: string, label: string): string {
  const matcher = new RegExp(`^${escapePattern(label)}:\\s*(.+)$`, "im");
  return prompt.match(matcher)?.[1]?.trim() ?? "";
}

function extractPromptBulletValue(prompt: string, label: string): string {
  const pattern = SUMMARY_BULLET_PATTERN_TEMPLATE.replace("%LABEL%", escapePattern(label));
  return prompt.match(new RegExp(pattern, "im"))?.[1]?.trim() ?? "";
}

function extractPromptHighlights(value: string): string[] {
  return value
    .split(PROMPT_HIGHLIGHT_SPLIT_PATTERN)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.toLowerCase() !== "not specified")
    .slice(0, 3);
}

function buildDeterministicInterviewPromptContext(
  prompt: string,
): DeterministicInterviewPromptContext {
  const studio = extractPromptLineValue(prompt, "Studio") || extractPromptBulletValue(prompt, "Name");
  const role = extractPromptLineValue(prompt, "Role") || extractPromptBulletValue(prompt, "Job title");
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
  const focusAreas = extractPromptHighlights(extractPromptBulletValue(prompt, "Interview focus areas"));
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
}

function buildDeterministicQuestionText(
  type: DeterministicInterviewQuestionType,
  context: DeterministicInterviewPromptContext,
): string {
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
}

function buildDeterministicFollowUps(
  type: DeterministicInterviewQuestionType,
  context: DeterministicInterviewPromptContext,
): string[] {
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
}

function buildDeterministicQuestionSet(prompt: string): string {
  const questionCount = parseQuestionCount(prompt);
  const includeTechnical = parseIncludeFlag(prompt, "technical", true);
  const includeBehavioral = parseIncludeFlag(prompt, "behavioral", true);
  const includeStudioSpecific = parseIncludeFlag(prompt, "studio-specific", true);
  const promptContext = buildDeterministicInterviewPromptContext(prompt);
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

  const questions: Array<{
    id: string;
    question: string;
    type: DeterministicInterviewQuestionType;
    followUps: string[];
    expectedDuration: number;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
  }> = [];

  for (let index = 0; index < questionCount; index += 1) {
    const position = index + 1;
    const type = candidateTypes[index % candidateTypes.length] ?? "behavioral";
    questions.push({
      id: `test-q${position}`,
      question: buildDeterministicQuestionText(type, promptContext),
      type,
      followUps: buildDeterministicFollowUps(type, promptContext),
      expectedDuration: 90,
      difficulty: type === "technical" ? "hard" : "medium",
      tags: ["deterministic", "test"],
    });
  }

  return JSON.stringify(questions);
}

function buildDeterministicFeedback(): string {
  return JSON.stringify({
    score: 78,
    feedback: "Clear structured response with actionable detail.",
    strengths: ["Structured explanation", "Relevant technical context"],
    improvements: ["Add one measurable outcome"],
  });
}

function buildDeterministicFinalAnalysis(): string {
  return JSON.stringify({
    overallScore: 80,
    strengths: ["Clear communication", "Practical technical reasoning"],
    improvements: ["Provide deeper metric context"],
    recommendations: ["Continue using STAR-style response framing"],
    feedback: "Consistent and production-ready interview performance.",
  });
}

function buildDeterministicCvQuestionnaire(): string {
  return JSON.stringify([
    {
      id: "personal-name",
      question: "What name and preferred contact details should appear on your resume?",
      category: "personal",
    },
    {
      id: "summary-impact",
      question: "What kind of gameplay impact or player-facing outcomes are you most proud of?",
      category: "summary",
    },
    {
      id: "experience-role",
      question:
        "Which game-industry roles, teams, or shipped features best represent your experience?",
      category: "experience",
    },
    {
      id: "skills-stack",
      question: "Which tools, engines, or programming languages do you rely on most often?",
      category: "skills",
    },
  ]);
}

function buildDeterministicSynthesizedResume(): string {
  return JSON.stringify({
    personalInfo: {
      name: "Test Candidate",
      email: "candidate@example.test",
      phone: "",
      location: "Remote",
      linkedIn: "",
      portfolio: "https://portfolio.example.test",
    },
    summary:
      "Gameplay-focused developer with a track record of shipping player-facing systems and collaborating with cross-functional teams.",
    experience: [
      {
        title: "Gameplay Programmer",
        company: "Test Studio",
        startDate: "2023",
        endDate: "Present",
        location: "Remote",
        description: "Built and tuned combat and progression systems for a live game.",
        achievements: [
          "Shipped feature updates with designers and QA",
          "Improved iteration speed with tooling automation",
        ],
      },
    ],
    education: [
      {
        degree: "BSc",
        field: "Computer Science",
        school: "Test University",
        year: "2022",
        gpa: "",
      },
    ],
    skills: {
      technical: ["TypeScript", "Bun", "Gameplay Systems"],
      soft: ["Collaboration", "Communication"],
      gaming: ["Combat Design", "Live Ops"],
    },
    projects: [
      {
        title: "Combat Sandbox",
        description: "Prototype focused on encounter pacing and enemy readability.",
        technologies: ["Bun", "TypeScript"],
        link: "https://portfolio.example.test/projects/combat-sandbox",
      },
    ],
    gamingExperience: {
      gameEngines: "Unreal Engine, Unity",
      platforms: "PC, Console",
      genres: "Action RPG, Co-op Shooter",
      shippedTitles: "1 released title",
    },
  });
}

function buildDeterministicCoverLetterContent(): string {
  return JSON.stringify({
    introduction:
      "I am excited to apply for this role because it aligns with the kind of systems-driven game development work I enjoy most.",
    body: "My recent work has focused on building player-facing gameplay systems, collaborating closely with designers, and turning feedback into polished features that ship reliably.",
    conclusion:
      "I would welcome the chance to contribute that same product-minded approach to your team.",
  });
}

function buildDeterministicScrapeEnrichment(): string {
  return JSON.stringify({
    summary:
      "The posting emphasizes hands-on delivery, cross-functional collaboration, and practical ownership in a live game environment.",
    hiringSignals: [
      "Team values shipping velocity and execution reliability",
      "Role expects direct collaboration with adjacent disciplines",
    ],
    interviewFocusAreas: [
      "Player-facing system ownership",
      "Cross-functional delivery tradeoffs",
      "Live-ops or iteration workflow",
    ],
    candidatePitchAngles: [
      "Highlight shipped gameplay or production outcomes",
      "Show how tooling or process improvements improved delivery",
    ],
  });
}

function buildDeterministicContent(prompt: string): string {
  const normalizedPrompt = prompt.toLowerCase();

  if (
    normalizedPrompt.includes("generate 8-12 interview-style questions") &&
    normalizedPrompt.includes("return a json array")
  ) {
    return buildDeterministicCvQuestionnaire();
  }

  if (
    normalizedPrompt.includes("structured resume (resumedata) json object") ||
    normalizedPrompt.includes("return only valid json matching this structure")
  ) {
    return buildDeterministicSynthesizedResume();
  }

  if (
    normalizedPrompt.includes('"overallscore": 0-100') &&
    normalizedPrompt.includes('"recommendations"')
  ) {
    return buildDeterministicFinalAnalysis();
  }

  if (
    normalizedPrompt.includes('"score": 0-100') &&
    normalizedPrompt.includes('"strengths"') &&
    normalizedPrompt.includes('"improvements"')
  ) {
    return buildDeterministicFeedback();
  }

  if (
    normalizedPrompt.includes("return strict json array only") &&
    normalizedPrompt.includes("interview")
  ) {
    return buildDeterministicQuestionSet(prompt);
  }

  if (
    normalizedPrompt.includes("write a compelling cover letter") &&
    normalizedPrompt.includes("respond with a json object containing three fields")
  ) {
    return buildDeterministicCoverLetterContent();
  }

  if (
    normalizedPrompt.includes("return strict json object only for scrape enrichment") &&
    normalizedPrompt.includes('"candidatepitchangles"')
  ) {
    return buildDeterministicScrapeEnrichment();
  }

  return "Deterministic test response.";
}

export class DeterministicTestProvider implements AIProvider {
  name: AIProviderType = TEST_AI_PROVIDER_NAME;
  model = TEST_AI_MODEL_NAME;

  generate(prompt: string): Promise<AIResponse> {
    const startedAt = Date.now();
    const content = buildDeterministicContent(prompt);
    const completedAt = Date.now();
    return Promise.resolve({
      id: `test-${startedAt}`,
      provider: this.name,
      model: this.model,
      content,
      timing: {
        startedAt,
        completedAt,
        totalTime: completedAt - startedAt,
      },
    });
  }

  stream(prompt: string): AsyncGenerator<string> {
    const content = buildDeterministicContent(prompt);
    return (async function* streamDeterministicContent(): AsyncGenerator<string> {
      await Promise.resolve();
      yield content;
    })();
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
