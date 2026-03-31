import {
  AI_CHAT_CONTEXT_AUTOMATION_RUNS_LIMIT,
  AI_CHAT_CONTEXT_AVAILABLE_RESUMES_LIMIT,
  AI_CHAT_CONTEXT_INTERVIEW_SESSIONS_LIMIT,
  AI_CHAT_CONTEXT_PORTFOLIO_PROJECTS_LIMIT,
  AI_CHAT_CONTEXT_SAVED_JOBS_LIMIT,
  AI_CHAT_CONTEXT_SKILL_MAPPINGS_LIMIT,
  AI_CHAT_HISTORY_FETCH_LIMIT,
  type AIChatContextDomain,
  type BrandSettings,
  type ChatMessage,
  DEFAULT_PROFILE_ID,
  resolveBrandSettings,
  settle,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { chatHistory } from "../../db/schema/chat-history";
import { interviewSessions } from "../../db/schema/interviews";
import { jobs, savedJobs } from "../../db/schema/jobs";
import { portfolioProjects } from "../../db/schema/portfolios";
import { resumes } from "../../db/schema/resumes";
import { skillMappings } from "../../db/schema/skill-mappings";
import { userProfile } from "../../db/schema/user";
import { getContextManagerFollowUps } from "./context-manager-followups";
import { buildDomainSystemPrompts, GAMING_INDUSTRY_CONTEXT } from "./prompts-system";

interface ConversationContext {
  systemPrompt: string;
  messages: Array<Pick<ChatMessage, "role" | "content">>;
}

const AUTOMATION_DOMAIN_PATTERN =
  /\b(automate|automation|rpa|auto[- ]?apply|fill.*form|run.*bot|bot.*apply)\b/i;
const RESUME_DOMAIN_PATTERN = /\b(resume|cv|bullet|experience|education|summary)\b/;
const JOB_SEARCH_DOMAIN_PATTERN = /\b(job|apply|salary|remote|position|company|hiring|opening)\b/;
const INTERVIEW_DOMAIN_PATTERN = /\b(interview|question|answer|practice|mock|prepare)\b/;
const PORTFOLIO_DOMAIN_PATTERN = /\b(portfolio|project|showcase|demo|sample)\b/;
const SKILLS_DOMAIN_PATTERN = /\b(skill|mapping|transfer|learn|career\s*path|gap)\b/;
const DOMAIN_PATTERN_ORDER: Array<[AIChatContextDomain, RegExp]> = [
  ["automation", AUTOMATION_DOMAIN_PATTERN],
  ["resume", RESUME_DOMAIN_PATTERN],
  ["job_search", JOB_SEARCH_DOMAIN_PATTERN],
  ["interview", INTERVIEW_DOMAIN_PATTERN],
  ["portfolio", PORTFOLIO_DOMAIN_PATTERN],
  ["skills", SKILLS_DOMAIN_PATTERN],
];

export class ConversationContextManager {
  private isChatRole(value: string): value is ChatMessage["role"] {
    return value === "user" || value === "assistant" || value === "system";
  }

  /**
   * Auto-detect domain from message content
   */
  inferDomain(message: string): AIChatContextDomain {
    const lower = message.toLowerCase();
    return DOMAIN_PATTERN_ORDER.find(([, pattern]) => pattern.test(lower))?.[0] ?? "general";
  }

  /**
   * Build full context for AI call with conversation history and domain-specific data
   */
  async buildContext(
    sessionId: string,
    currentMessage: string,
    preferredDomain?: AIChatContextDomain,
    runtimeBrand?: BrandSettings | null,
  ): Promise<ConversationContext> {
    const domain = preferredDomain ?? this.inferDomain(currentMessage);
    const messages = await this.loadConversationMessages(sessionId, currentMessage);
    const profile = await this.loadDefaultProfile();
    const domainContext = await this.loadDomainContext(domain);
    const systemPrompt = this.buildSystemPrompt(
      domain,
      profile,
      domainContext,
      runtimeBrand ?? resolveBrandSettings(undefined),
    );
    return { systemPrompt, messages };
  }

  /**
   * Loads recent conversation history and appends the current user message once.
   */
  private async loadConversationMessages(
    sessionId: string,
    currentMessage: string,
  ): Promise<Array<Pick<ChatMessage, "role" | "content">>> {
    const history = await db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.sessionId, sessionId))
      .orderBy(desc(chatHistory.timestamp))
      .limit(AI_CHAT_HISTORY_FETCH_LIMIT);

    const messages: Array<Pick<ChatMessage, "role" | "content">> = history
      .reverse()
      .flatMap((msg) =>
        this.isChatRole(msg.role)
          ? [
              {
                role: msg.role,
                content: msg.content,
              },
            ]
          : [],
      );

    const lastMessage = messages[messages.length - 1];
    const hasCurrentMessageAtTail =
      lastMessage?.role === "user" && lastMessage.content === currentMessage;
    if (!hasCurrentMessageAtTail) {
      messages.push({ role: "user", content: currentMessage });
    }

    return messages;
  }

  /**
   * Loads the default user profile row when available.
   */
  private async loadDefaultProfile() {
    const profileRows = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
    return profileRows[0] ?? null;
  }

  /**
   * Builds the final system prompt from the selected domain and user context.
   */
  private buildSystemPrompt(
    domain: AIChatContextDomain,
    profile: typeof userProfile.$inferSelect | null,
    domainContext: string | null,
    runtimeBrand: BrandSettings,
  ): string {
    const domainSystemPrompts = buildDomainSystemPrompts(runtimeBrand);
    const userContext = profile
      ? `\n\nUser Context:\nName: ${profile.name || "Not set"}\nCurrent Role: ${profile.currentRole || "Not set"}\nYears Experience: ${profile.yearsExperience || "Not set"}\nLocation: ${profile.location || "Not set"}`
      : "";
    const relevantData = domainContext ? `\n\nRelevant Data:\n${domainContext}` : "";
    return `${domainSystemPrompts[domain] || domainSystemPrompts.general}${userContext}${relevantData}\n\n${GAMING_INDUSTRY_CONTEXT}`;
  }

  /**
   * Load domain-specific data from DB
   */
  private async loadDomainContext(domain: AIChatContextDomain): Promise<string | null> {
    const loader = this.getDomainContextLoader(domain);
    if (!loader) {
      return null;
    }
    const contextResult = await settle(loader());

    if (contextResult.status === "rejected") {
      return null;
    }

    return contextResult.value;
  }

  private getDomainContextLoader(
    domain: AIChatContextDomain,
  ): (() => Promise<string | null>) | null {
    const loaders = {
      automation: () => this.loadAutomationContext(),
      interview: () => this.loadInterviewContext(),
      job_search: () => this.loadJobSearchContext(),
      portfolio: () => this.loadPortfolioContext(),
      resume: () => this.loadResumeContext(),
      skills: () => this.loadSkillsContext(),
    } as const;
    return domain === "general" ? null : loaders[domain];
  }

  private async loadResumeContext(): Promise<string | null> {
    const defaultResume = await db.select().from(resumes).limit(1);
    if (defaultResume.length === 0) {
      return null;
    }
    const resume = defaultResume[0];
    return `User's Resume: "${resume.name}"\nSummary: ${resume.summary || "Not set"}\nSkills: ${JSON.stringify(resume.skills || {})}`;
  }

  private async loadJobSearchContext(): Promise<string | null> {
    const saved = await db
      .select({ title: jobs.title, company: jobs.company })
      .from(savedJobs)
      .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .limit(AI_CHAT_CONTEXT_SAVED_JOBS_LIMIT);
    if (saved.length === 0) {
      return null;
    }
    return `Saved Jobs:\n${saved.map((entry) => `- ${entry.title} at ${entry.company}`).join("\n")}`;
  }

  private async loadInterviewContext(): Promise<string | null> {
    const sessions = await db
      .select()
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt))
      .limit(AI_CHAT_CONTEXT_INTERVIEW_SESSIONS_LIMIT);
    if (sessions.length === 0) {
      return null;
    }
    return `Recent Interview Sessions: ${sessions.length} completed`;
  }

  private async loadPortfolioContext(): Promise<string | null> {
    const projects = await db
      .select()
      .from(portfolioProjects)
      .limit(AI_CHAT_CONTEXT_PORTFOLIO_PROJECTS_LIMIT);
    if (projects.length === 0) {
      return null;
    }
    return `Portfolio Projects:\n${projects.map((project) => `- ${project.title}: ${project.technologies?.join(", ") || "No tech listed"}`).join("\n")}`;
  }

  private async loadSkillsContext(): Promise<string | null> {
    const mappings = await db
      .select()
      .from(skillMappings)
      .limit(AI_CHAT_CONTEXT_SKILL_MAPPINGS_LIMIT);
    if (mappings.length === 0) {
      return null;
    }
    return `Skill Mappings:\n${mappings.map((mapping) => `- ${mapping.gameExpression} → ${mapping.transferableSkill}`).join("\n")}`;
  }

  private async loadAutomationContext(): Promise<string | null> {
    const recentRuns = await db
      .select()
      .from(automationRuns)
      .orderBy(desc(automationRuns.createdAt))
      .limit(AI_CHAT_CONTEXT_AUTOMATION_RUNS_LIMIT);
    const availableResumes = await db
      .select()
      .from(resumes)
      .limit(AI_CHAT_CONTEXT_AVAILABLE_RESUMES_LIMIT);
    const runLines = recentRuns.map(
      (run) =>
        `- [${run.status}] ${run.type} (${run.createdAt})${run.error ? ` Error: ${run.error}` : ""}`,
    );
    const resumeLines = availableResumes.map((resume) => `- "${resume.name}" (ID: ${resume.id})`);
    const parts = [
      ...(runLines.length > 0
        ? [`Recent Automation Runs (${recentRuns.length}):`, ...runLines]
        : []),
      ...(resumeLines.length > 0 ? ["\nAvailable Resumes:", ...resumeLines] : []),
    ];
    return parts.length > 0 ? parts.join("\n") : null;
  }

  /**
   * Generate follow-up suggestions based on domain and last response
   */
  generateFollowUps(domain: AIChatContextDomain): string[] {
    return getContextManagerFollowUps(domain);
  }
}

export const contextManager = new ConversationContextManager();
