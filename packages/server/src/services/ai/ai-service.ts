import type {
  AIRouting,
  AIRoutingPurpose,
  AIProviderConfig,
  AIProviderStatus,
  AIProviderType,
  AIResponse,
  GenerateOptions,
} from "@bao/shared";
import {
  AI_CHAT_CONTEXT_MESSAGE_LIMIT,
  AI_PROVIDER_DEFAULT,
  AI_PROVIDER_DEFAULT_ORDER,
  API_ERROR_ALL_PROVIDERS_STREAM_FAILED,
  DECIMAL_RADIX,
  DEFAULT_AI_ROUTING,
  LOCAL_AI_AUTO_DETECT_MODEL,
  normalizeAIRouting,
  toErrorMessage,
} from "@bao/shared";
import { createServerLogger } from "../../utils/logger";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { HuggingFaceProvider } from "./huggingface-provider";
import { LocalProvider } from "./local-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./provider-interface";

const TEST_AI_PROVIDER_NAME = "local" as const;
const TEST_AI_MODEL_NAME = "deterministic-test-model";
const TEST_AI_MAX_QUESTION_COUNT = 12;
const EXACT_QUESTION_COUNT_PATTERN = /exactly\s+(\d+)\s+questions/i;
const GENERATE_QUESTION_COUNT_PATTERN = /generate\s+(\d+)\s+interview questions/i;
const SUMMARY_BULLET_PATTERN_TEMPLATE = String.raw`^-\s+%LABEL%:\s*(.+)$`;
const PROMPT_HIGHLIGHT_SPLIT_PATTERN = /[;,]/u;
const aiServiceLogger = createServerLogger("ai-service");
const describeProviderError = (
  providerName: AIProviderType,
  operation: string,
  error: unknown,
): string => {
  const errorMessage = toErrorMessage(error);
  aiServiceLogger.error("AI provider operation failed", {
    providerName,
    operation,
    error: errorMessage,
  });
  return errorMessage;
};
type AvailabilityResult = { isAvailable: boolean; error: string | null };
type GenerationAttempt = { response: AIResponse | null; error: string | null };
type StreamAttempt = { result: IteratorResult<string> | null; error: string | null };
type FallbackRequest = {
  providerOrder: AIProviderType[];
  index: number;
  contextualPrompt: string;
  providerOptions: Omit<GenerateOptions, "messages"> | undefined;
  errors: ProviderFailure[];
};
type AIServiceSettings = {
  geminiApiKey?: string | null;
  claudeApiKey?: string | null;
  openaiApiKey?: string | null;
  huggingfaceToken?: string | null;
  localModelEndpoint?: string | null;
  localModelName?: string | null;
  aiRouting?: AIRouting | null;
  preferredProvider?: string | null;
  preferredModel?: string | null;
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
  type: "intro" | "behavioral" | "technical" | "studio-specific" | "closing",
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
  type: "intro" | "behavioral" | "technical" | "studio-specific" | "closing",
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

type ProviderFailure = { provider: AIProviderType; error: string };

function appendOptionalProviderConfig(
  configs: AIProviderConfig[],
  provider: Exclude<AIProviderType, "local" | "huggingface">,
  apiKey?: string | null,
): void {
  if (!apiKey) {
    return;
  }

  configs.push({
    provider,
    apiKey,
    enabled: true,
  });
}

function buildProviderConfigs(settings?: AIServiceSettings): AIProviderConfig[] {
  const localModelEndpoint =
    typeof settings?.localModelEndpoint === "string" && settings.localModelEndpoint.trim()
      ? settings.localModelEndpoint.trim()
      : null;
  const localModelName =
    typeof settings?.localModelName === "string" && settings.localModelName.trim()
      ? settings.localModelName.trim()
      : null;

  const configs: AIProviderConfig[] = [
    {
      provider: "local",
      enabled: true,
      ...(localModelEndpoint ? { baseUrl: localModelEndpoint } : {}),
      ...(localModelName ? { model: localModelName } : {}),
    },
  ];

  appendOptionalProviderConfig(configs, "gemini", settings?.geminiApiKey);
  appendOptionalProviderConfig(configs, "claude", settings?.claudeApiKey);
  appendOptionalProviderConfig(configs, "openai", settings?.openaiApiKey);
  configs.push({
    provider: "huggingface",
    enabled: true,
    ...(settings?.huggingfaceToken ? { apiKey: settings.huggingfaceToken } : {}),
  });

  return configs;
}

function buildDeterministicQuestionSet(prompt: string): string {
  const questionCount = parseQuestionCount(prompt);
  const includeTechnical = parseIncludeFlag(prompt, "technical", true);
  const includeBehavioral = parseIncludeFlag(prompt, "behavioral", true);
  const includeStudioSpecific = parseIncludeFlag(prompt, "studio-specific", true);
  const promptContext = buildDeterministicInterviewPromptContext(prompt);
  const candidateTypes: Array<
    "intro" | "behavioral" | "technical" | "studio-specific" | "closing"
  > = ["intro"];
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
    type: "intro" | "behavioral" | "technical" | "studio-specific" | "closing";
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

class DeterministicTestProvider implements AIProvider {
  name = TEST_AI_PROVIDER_NAME;
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

/**
 * Multi-provider AI service with fallback capabilities
 */
export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private preferredProvider?: AIProviderType;
  private routing: AIRouting = DEFAULT_AI_ROUTING;
  private fallbackOrder: AIProviderType[] = [];

  constructor(
    configs: AIProviderConfig[],
    preferredProvider?: AIProviderType,
    routing?: AIRouting,
  ) {
    this.preferredProvider = preferredProvider;
    this.routing = normalizeAIRouting(routing, preferredProvider ?? AI_PROVIDER_DEFAULT);
    this.initializeProviders(configs);
    this.rebuildFallbackOrder(configs);
  }

  /**
   * Create an AIService from a settings DB row.
   * Converts the flat settings config into AIProviderConfig[] format.
   * Used by WebSocket handlers, route handlers, and services.
   */
  static fromSettings(settings?: AIServiceSettings): AIService {
    if (AIService.isTestRuntime()) {
      return AIService.createDeterministicTestService();
    }

    const configs = buildProviderConfigs(settings);
    const preferredProvider = AIService.resolvePreferredProvider(
      settings?.aiRouting?.chat?.provider ?? settings?.preferredProvider,
    );
    const routing = normalizeAIRouting(
      settings?.aiRouting,
      preferredProvider,
      settings?.preferredModel,
    );
    return new AIService(configs, preferredProvider, routing);
  }

  private static isTestRuntime(): boolean {
    return process.env.NODE_ENV === "test" || process.env.BAO_TEST_MODE === "1";
  }

  private static createDeterministicTestService(): AIService {
    const service = new AIService([], TEST_AI_PROVIDER_NAME, DEFAULT_AI_ROUTING);
    service.providers.clear();
    service.providers.set(TEST_AI_PROVIDER_NAME, new DeterministicTestProvider());
    service.fallbackOrder = [TEST_AI_PROVIDER_NAME];
    service.preferredProvider = TEST_AI_PROVIDER_NAME;
    service.routing = normalizeAIRouting(undefined, TEST_AI_PROVIDER_NAME, TEST_AI_MODEL_NAME);
    return service;
  }

  /**
   * Resolve preferred provider to a known supported provider.
   */
  private static resolvePreferredProvider(preferredProvider?: string | null): AIProviderType {
    if (!preferredProvider) return AI_PROVIDER_DEFAULT_ORDER[0];
    const matchedProvider = AI_PROVIDER_DEFAULT_ORDER.find(
      (provider) => provider === preferredProvider,
    );
    return matchedProvider ?? AI_PROVIDER_DEFAULT_ORDER[0];
  }

  private static canCreateLocalProvider(config: AIProviderConfig): boolean {
    return (
      config.provider === "local" &&
      typeof config.baseUrl === "string" &&
      config.baseUrl.trim().length > 0 &&
      URL.canParse(config.baseUrl)
    );
  }

  private static createProvider(config: AIProviderConfig): AIProvider | null {
    switch (config.provider) {
      case "gemini":
        return config.apiKey ? new GeminiProvider(config.apiKey, config.model) : null;
      case "claude":
        return config.apiKey ? new ClaudeProvider(config.apiKey, config.model) : null;
      case "openai":
        return config.apiKey ? new OpenAIProvider(config.apiKey, config.model) : null;
      case "huggingface":
        // HuggingFace works without API key (free tier)
        return new HuggingFaceProvider(config.apiKey, config.model);
      case "local":
        if (!AIService.canCreateLocalProvider(config)) {
          return null;
        }
        return new LocalProvider(config.baseUrl, config.model || LOCAL_AI_AUTO_DETECT_MODEL);
      default:
        return null;
    }
  }

  /**
   * Initialize AI providers based on configurations
   */
  private initializeProviders(configs: AIProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled) continue;
      const provider = AIService.createProvider(config);
      if (provider) {
        this.providers.set(config.provider, provider);
      }
    }

    // Always ensure HuggingFace is available as fallback (free tier)
    if (!this.providers.has("huggingface")) {
      this.providers.set("huggingface", new HuggingFaceProvider());
    }
  }

  /**
   * Setup fallback order for providers
   */
  private rebuildFallbackOrder(configs: AIProviderConfig[]): void {
    const enabledProviders: AIProviderType[] = Array.from(
      new Set(configs.filter((config) => config.enabled).map((config) => config.provider)),
    );

    const ordered: AIProviderType[] = [];

    const preferred =
      this.preferredProvider && enabledProviders.includes(this.preferredProvider)
        ? this.preferredProvider
        : undefined;

    if (preferred) ordered.push(preferred);

    for (const provider of AI_PROVIDER_DEFAULT_ORDER) {
      if (!ordered.includes(provider) && enabledProviders.includes(provider)) {
        ordered.push(provider);
      }
    }

    for (const provider of enabledProviders) {
      if (!ordered.includes(provider)) ordered.push(provider);
    }

    this.fallbackOrder = ordered;
  }

  private refreshFallbackOrder(): void {
    const providerConfigs: AIProviderConfig[] = [];
    for (const provider of this.providers.keys()) {
      providerConfigs.push({ provider, enabled: true });
    }

    this.rebuildFallbackOrder(providerConfigs);
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name?: AIProviderType): AIProvider | null {
    if (name) {
      return this.providers.get(name) || null;
    }

    // Return preferred provider or first in fallback order
    if (this.preferredProvider && this.providers.has(this.preferredProvider)) {
      return this.providers.get(this.preferredProvider) || null;
    }

    return this.providers.values().next().value || null;
  }

  private resolveRoutingTarget(options?: GenerateOptions): {
    purpose: AIRoutingPurpose;
    provider: AIProviderType;
    model?: string;
  } {
    const purpose = options?.purpose ?? "chat";
    const routedTarget = this.routing[purpose] ?? this.routing.chat;
    const provider =
      options?.provider ??
      routedTarget?.provider ??
      this.preferredProvider ??
      AI_PROVIDER_DEFAULT_ORDER[0];
    const model =
      typeof options?.model === "string" && options.model.trim().length > 0
        ? options.model.trim()
        : routedTarget?.model;
    return model ? { purpose, provider, model } : { purpose, provider };
  }

  private buildProviderOrder(options?: GenerateOptions): AIProviderType[] {
    const preferredTarget = this.resolveRoutingTarget(options);
    const ordered: AIProviderType[] = [];

    ordered.push(preferredTarget.provider);
    if (this.preferredProvider && !ordered.includes(this.preferredProvider)) {
      ordered.push(this.preferredProvider);
    }

    for (const provider of this.fallbackOrder) {
      if (!ordered.includes(provider)) {
        ordered.push(provider);
      }
    }

    return ordered;
  }

  private static mergePromptWithContext(prompt: string, options?: GenerateOptions): string {
    const messageHistory = options?.messages;
    if (!messageHistory || messageHistory.length === 0) {
      return prompt;
    }

    const historyLines = messageHistory
      .slice(-AI_CHAT_CONTEXT_MESSAGE_LIMIT)
      .map((message, index) => `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`)
      .join("\n");

    return [
      "Use the following conversation history to keep responses contextually consistent.",
      "Conversation history:",
      historyLines,
      "Current user message:",
      prompt,
    ].join("\n\n");
  }

  private static toProviderOptions(
    routingTarget: ReturnType<AIService["resolveRoutingTarget"]>,
    options?: GenerateOptions,
  ): Omit<GenerateOptions, "messages"> | undefined {
    if (!options) {
      return routingTarget.model
        ? {
            purpose: routingTarget.purpose,
            provider: routingTarget.provider,
            model: routingTarget.model,
          }
        : {
            purpose: routingTarget.purpose,
            provider: routingTarget.provider,
          };
    }

    const { temperature, maxTokens, topP, topK, timeout, systemPrompt } = options;
    return {
      purpose: routingTarget.purpose,
      provider: routingTarget.provider,
      model: routingTarget.model,
      temperature,
      maxTokens,
      topP,
      topK,
      timeout,
      systemPrompt,
    };
  }

  private static pushProviderError(
    errors: ProviderFailure[],
    provider: AIProviderType,
    error: string,
  ): void {
    errors.push({ provider, error });
  }

  private static buildFailureMessage(errors: ProviderFailure[]): string {
    return errors.map((entry) => `${entry.provider}: ${entry.error}`).join("; ");
  }

  private async resolveAvailableProvider(
    providerName: AIProviderType,
    errors: ProviderFailure[],
  ): Promise<AIProvider | null> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return null;
    }

    const availability: AvailabilityResult = await provider
      .isAvailable()
      .then((isAvailable) => ({ isAvailable, error: null }))
      .catch((error: unknown) => ({
        isAvailable: false,
        error: describeProviderError(providerName, "isAvailable", error),
      }));
    if (availability.error) {
      AIService.pushProviderError(errors, providerName, availability.error);
      return null;
    }
    if (!availability.isAvailable) {
      AIService.pushProviderError(errors, providerName, "Provider not available");
      return null;
    }
    return provider;
  }

  private async generateFromProvider(
    providerName: AIProviderType,
    contextualPrompt: string,
    providerOptions: Omit<GenerateOptions, "messages"> | undefined,
    errors: ProviderFailure[],
  ): Promise<AIResponse | null> {
    const provider = await this.resolveAvailableProvider(providerName, errors);
    if (!provider) {
      return null;
    }

    const generationResult: GenerationAttempt = await provider
      .generate(contextualPrompt, providerOptions)
      .then((response) => ({ response, error: null }))
      .catch((error: unknown) => ({
        response: null,
        error: describeProviderError(providerName, "generate", error),
      }));
    if (generationResult.error) {
      AIService.pushProviderError(errors, providerName, generationResult.error);
      return null;
    }

    if (!generationResult.response) {
      return null;
    }
    if (generationResult.response.error) {
      AIService.pushProviderError(errors, providerName, generationResult.response.error);
      return null;
    }
    return generationResult.response;
  }

  private async generateWithFallback(request: FallbackRequest): Promise<AIResponse | null> {
    const providerName = request.providerOrder[request.index];
    if (!providerName) {
      return null;
    }

    const response = await this.generateFromProvider(
      providerName,
      request.contextualPrompt,
      request.providerOptions,
      request.errors,
    );
    if (response) {
      return response;
    }
    return this.generateWithFallback({ ...request, index: request.index + 1 });
  }

  private buildGenerateFailureResponse(
    errors: ProviderFailure[],
    fallbackProvider: AIProviderType,
  ): AIResponse {
    const now = Date.now();
    const errorMessage = AIService.buildFailureMessage(errors);
    return {
      id: `failed-${now}`,
      provider: fallbackProvider,
      model: "none",
      content: "",
      error: `All providers failed: ${errorMessage}`,
      timing: {
        startedAt: now,
        completedAt: now,
        totalTime: 0,
      },
    };
  }

  private async *streamProviderIterator(
    providerName: AIProviderType,
    iterator: AsyncIterator<string>,
    errors: ProviderFailure[],
    hasYielded: boolean,
  ): AsyncGenerator<
    { chunk: string; provider: AIProviderType },
    { hasYielded: boolean; failed: boolean }
  > {
    const nextChunk: StreamAttempt = await iterator
      .next()
      .then((result) => ({ result, error: null }))
      .catch((error: unknown) => ({
        result: null,
        error: describeProviderError(providerName, "stream", error),
      }));
    if (nextChunk.error) {
      AIService.pushProviderError(errors, providerName, nextChunk.error);
      return { hasYielded, failed: true };
    }
    if (!nextChunk.result || nextChunk.result.done) {
      return { hasYielded, failed: false };
    }
    yield { chunk: nextChunk.result.value, provider: providerName };
    return yield* this.streamProviderIterator(providerName, iterator, errors, true);
  }

  private async *streamProvider(
    providerName: AIProviderType,
    contextualPrompt: string,
    providerOptions: Omit<GenerateOptions, "messages"> | undefined,
    errors: ProviderFailure[],
  ): AsyncGenerator<
    { chunk: string; provider: AIProviderType },
    { hasYielded: boolean; failed: boolean }
  > {
    const provider = await this.resolveAvailableProvider(providerName, errors);
    if (!provider) {
      return { hasYielded: false, failed: true };
    }
    const iterator = provider.stream(contextualPrompt, providerOptions)[Symbol.asyncIterator]();
    return yield* this.streamProviderIterator(providerName, iterator, errors, false);
  }

  private async *streamWithFallback(
    request: FallbackRequest,
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }, boolean> {
    const providerName = request.providerOrder[request.index];
    if (!providerName) {
      return false;
    }

    const streamResult = yield* this.streamProvider(
      providerName,
      request.contextualPrompt,
      request.providerOptions,
      request.errors,
    );
    if (streamResult.hasYielded && !streamResult.failed) {
      return true;
    }
    return yield* this.streamWithFallback({ ...request, index: request.index + 1 });
  }

  /**
   * Generate a response with automatic fallback
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const errors: ProviderFailure[] = [];
    const contextualPrompt = AIService.mergePromptWithContext(prompt, options);
    const routingTarget = this.resolveRoutingTarget(options);
    const providerOrder = this.buildProviderOrder(options);
    const providerOptions = AIService.toProviderOptions(routingTarget, options);
    const response = await this.generateWithFallback({
      providerOrder,
      index: 0,
      contextualPrompt,
      providerOptions,
      errors,
    });
    if (response) {
      return response;
    }
    return this.buildGenerateFailureResponse(errors, routingTarget.provider);
  }

  /**
   * Stream a response with automatic fallback
   */
  async *stream(
    prompt: string,
    options?: GenerateOptions,
  ): AsyncGenerator<{ chunk: string; provider: AIProviderType }> {
    const errors: ProviderFailure[] = [];
    const contextualPrompt = AIService.mergePromptWithContext(prompt, options);
    const routingTarget = this.resolveRoutingTarget(options);
    const providerOrder = this.buildProviderOrder(options);
    const providerOptions = AIService.toProviderOptions(routingTarget, options);
    const streamed = yield* this.streamWithFallback({
      providerOrder,
      index: 0,
      contextualPrompt,
      providerOptions,
      errors,
    });
    if (streamed) {
      return;
    }

    const errorMessage = AIService.buildFailureMessage(errors);
    throw new Error(`${API_ERROR_ALL_PROVIDERS_STREAM_FAILED}: ${errorMessage}`);
  }

  /**
   * Get status of all providers
   */
  async getAvailableProviders(): Promise<AIProviderStatus[]> {
    const checks = Array.from(this.providers.entries()).map(async ([providerName, provider]) => {
      if (providerName === "local" && provider.baseUrl) {
        const diagnostics = await LocalProvider.inspectEndpoint(
          provider.baseUrl,
          this.getActiveModel("local") ?? undefined,
        );
        return {
          provider: providerName,
          available: diagnostics.code === "healthy",
          health: diagnostics.code === "healthy" ? "healthy" : "down",
          lastCheck: Date.now(),
          error: diagnostics.message,
          endpoint: diagnostics.endpoint,
          selectedModel: diagnostics.selectedModel,
          availableModels: diagnostics.availableModels,
          diagnosticCode: diagnostics.code,
        } satisfies AIProviderStatus;
      }

      return provider.isAvailable().then(
        (available): AIProviderStatus => ({
          provider: providerName,
          available,
          health: available ? "healthy" : "down",
          lastCheck: Date.now(),
          selectedModel: provider.model,
        }),
        (error: unknown): AIProviderStatus => ({
          provider: providerName,
          available: false,
          health: "down",
          lastCheck: Date.now(),
          error: toErrorMessage(error),
          selectedModel: provider.model,
          diagnosticCode: "error",
        }),
      );
    });
    return Promise.all(checks);
  }

  /**
   * Detect local AI providers (RamaLama, Ollama)
   */
  async detectLocalProviders(): Promise<
    Array<{
      baseUrl: string;
      name: string;
      available: boolean;
      availableModels?: string[];
      diagnosticCode?: AIProviderStatus["diagnosticCode"];
      message?: string;
    }>
  > {
    return await LocalProvider.detectLocalServers();
  }

  /**
   * Update preferred provider
   */
  setPreferredProvider(provider: AIProviderType): void {
    if (this.providers.has(provider)) {
      this.preferredProvider = provider;
      this.refreshFallbackOrder();
    }
  }

  /**
   * Add a new provider at runtime
   */
  addProvider(config: AIProviderConfig): boolean {
    const provider = AIService.createProvider(config);
    if (!provider) {
      return false;
    }

    this.providers.set(config.provider, provider);
    this.refreshFallbackOrder();
    return true;
  }

  /**
   * Remove a provider
   */
  removeProvider(provider: AIProviderType): boolean {
    const deleted = this.providers.delete(provider);

    if (deleted) {
      // Remove from fallback order
      this.fallbackOrder = this.fallbackOrder.filter((p) => p !== provider);

      // Update preferred if it was removed
      if (this.preferredProvider === provider) {
        this.preferredProvider = this.fallbackOrder[0];
        if (!this.preferredProvider) {
          this.preferredProvider = AI_PROVIDER_DEFAULT_ORDER[0];
        }
      }

      this.refreshFallbackOrder();
    }

    return deleted;
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get the current fallback order
   */
  getFallbackOrder(): AIProviderType[] {
    return [...this.fallbackOrder];
  }

  /**
   * Get the current purpose-aware routing table.
   */
  getRouting(): AIRouting {
    return normalizeAIRouting(this.routing, this.preferredProvider ?? AI_PROVIDER_DEFAULT);
  }

  /**
   * Get the active model name for a given provider (detected or configured).
   */
  getActiveModel(providerType: AIProviderType): string | null {
    const provider = this.providers.get(providerType);
    if (!provider) return null;
    const model = provider.model;
    return model && model !== LOCAL_AI_AUTO_DETECT_MODEL ? model : null;
  }
}
