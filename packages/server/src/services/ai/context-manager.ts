import { AI_CHAT_HISTORY_FETCH_LIMIT } from "@bao/shared";
import type { AIChatContextDomain, ChatMessage } from "@bao/shared";
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
import { DOMAIN_SYSTEM_PROMPTS, GAMING_INDUSTRY_CONTEXT } from "./prompts";

interface ConversationContext {
  systemPrompt: string;
  messages: Array<Pick<ChatMessage, "role" | "content">>;
}

export class ConversationContextManager {
  private isChatRole(value: string): value is ChatMessage["role"] {
    return value === "user" || value === "assistant" || value === "system";
  }

  /**
   * Auto-detect domain from message content
   */
  inferDomain(message: string): AIChatContextDomain {
    const lower = message.toLowerCase();
    // Automation must be checked BEFORE job_search since "apply" overlaps
    if (/\b(automate|automation|rpa|auto[- ]?apply|fill.*form|run.*bot|bot.*apply)\b/i.test(lower))
      return "automation";
    if (/\b(resume|cv|bullet|experience|education|summary)\b/.test(lower)) return "resume";
    if (/\b(job|apply|salary|remote|position|company|hiring|opening)\b/.test(lower))
      return "job_search";
    if (/\b(interview|question|answer|practice|mock|prepare)\b/.test(lower)) return "interview";
    if (/\b(portfolio|project|showcase|demo|sample)\b/.test(lower)) return "portfolio";
    if (/\b(skill|mapping|transfer|learn|career\s*path|gap)\b/.test(lower)) return "skills";
    return "general";
  }

  /**
   * Build full context for AI call with conversation history and domain-specific data
   */
  async buildContext(
    sessionId: string,
    currentMessage: string,
    preferredDomain?: AIChatContextDomain,
  ): Promise<ConversationContext> {
    const domain = preferredDomain ?? this.inferDomain(currentMessage);

    // Load conversation history (last 20 messages)
    const history = await db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.sessionId, sessionId))
      .orderBy(desc(chatHistory.timestamp))
      .limit(AI_CHAT_HISTORY_FETCH_LIMIT);

    // Reverse to get chronological order
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

    // Ensure current message is present once when context is assembled.
    const lastMessage = messages[messages.length - 1];
    const hasCurrentMessageAtTail =
      lastMessage?.role === "user" && lastMessage.content === currentMessage;
    if (!hasCurrentMessageAtTail) {
      messages.push({ role: "user", content: currentMessage });
    }

    // Load user profile
    const profileRows = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
    const profile = profileRows[0];

    // Build system prompt with domain context
    let systemPrompt = DOMAIN_SYSTEM_PROMPTS[domain] || DOMAIN_SYSTEM_PROMPTS.general;

    // Add user context
    if (profile) {
      systemPrompt += `\n\nUser Context:\nName: ${profile.name || "Not set"}\nCurrent Role: ${profile.currentRole || "Not set"}\nYears Experience: ${profile.yearsExperience || "Not set"}\nLocation: ${profile.location || "Not set"}`;
    }

    // Add domain-specific data
    const domainContext = await this.loadDomainContext(domain);
    if (domainContext) {
      systemPrompt += `\n\nRelevant Data:\n${domainContext}`;
    }

    // Add gaming industry context
    systemPrompt += `\n\n${GAMING_INDUSTRY_CONTEXT}`;

    return { systemPrompt, messages };
  }

  /**
   * Load domain-specific data from DB
   */
  private async loadDomainContext(domain: AIChatContextDomain): Promise<string | null> {
    return Promise.resolve()
      .then(async () => {
        switch (domain) {
          case "resume": {
            const defaultResume = await db.select().from(resumes).limit(1);
            if (defaultResume.length > 0) {
              const r = defaultResume[0];
              return `User's Resume: "${r.name}"\nSummary: ${r.summary || "Not set"}\nSkills: ${JSON.stringify(r.skills || {})}`;
            }
            return null;
          }
          case "job_search": {
            const saved = await db
              .select({ title: jobs.title, company: jobs.company })
              .from(savedJobs)
              .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
              .limit(10);
            if (saved.length > 0) {
              return `Saved Jobs:\n${saved.map((j) => `- ${j.title} at ${j.company}`).join("\n")}`;
            }
            return null;
          }
          case "interview": {
            const sessions = await db
              .select()
              .from(interviewSessions)
              .orderBy(desc(interviewSessions.createdAt))
              .limit(3);
            if (sessions.length > 0) {
              return `Recent Interview Sessions: ${sessions.length} completed`;
            }
            return null;
          }
          case "portfolio": {
            const projects = await db.select().from(portfolioProjects).limit(10);
            if (projects.length > 0) {
              return `Portfolio Projects:\n${projects.map((p) => `- ${p.title}: ${p.technologies?.join(", ") || "No tech listed"}`).join("\n")}`;
            }
            return null;
          }
          case "skills": {
            const mappings = await db.select().from(skillMappings).limit(20);
            if (mappings.length > 0) {
              return `Skill Mappings:\n${mappings.map((m) => `- ${m.gameExpression} → ${m.transferableSkill}`).join("\n")}`;
            }
            return null;
          }
          case "automation": {
            const recentRuns = await db
              .select()
              .from(automationRuns)
              .orderBy(desc(automationRuns.createdAt))
              .limit(5);
            const parts: string[] = [];
            if (recentRuns.length > 0) {
              parts.push(`Recent Automation Runs (${recentRuns.length}):`);
              for (const run of recentRuns) {
                parts.push(
                  `- [${run.status}] ${run.type} (${run.createdAt})${run.error ? ` Error: ${run.error}` : ""}`,
                );
              }
            }
            // List available resumes so the AI can offer choices
            const availableResumes = await db.select().from(resumes).limit(10);
            if (availableResumes.length > 0) {
              parts.push("\nAvailable Resumes:");
              for (const r of availableResumes) {
                parts.push(`- "${r.name}" (ID: ${r.id})`);
              }
            }
            return parts.length > 0 ? parts.join("\n") : null;
          }
          default:
            return null;
        }
      })
      .catch(() => null);
  }

  /**
   * Generate follow-up suggestions based on domain and last response
   */
  generateFollowUps(domain: AIChatContextDomain): string[] {
    const followUps: Record<AIChatContextDomain, string[]> = {
      resume: [
        "Can you help me improve my summary section?",
        "What skills should I highlight for this role?",
        "How can I quantify my achievements better?",
      ],
      job_search: [
        "What studios are hiring for my skills?",
        "How does my profile match this role?",
        "What salary should I expect?",
      ],
      interview: [
        "Give me a practice question for this role",
        "How should I answer behavioral questions?",
        "What questions should I ask the interviewer?",
      ],
      portfolio: [
        "How can I improve my project descriptions?",
        "What projects should I add to stand out?",
        "How should I organize my portfolio?",
      ],
      skills: [
        "What skills am I missing for this career path?",
        "How do my gaming skills translate professionally?",
        "What should I learn next?",
      ],
      automation: [
        "What's the status of my last application?",
        "Show my automation run history",
        "Apply to another job",
      ],
      general: [
        "Help me with my resume",
        "Find jobs that match my profile",
        "Prepare me for an interview",
      ],
    };

    return followUps[domain] || followUps.general;
  }
}

export const contextManager = new ConversationContextManager();
