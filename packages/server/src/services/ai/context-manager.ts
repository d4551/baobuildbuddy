import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { chatHistory } from "../../db/schema/chat-history";
import { interviewSessions } from "../../db/schema/interviews";
import { jobs, savedJobs } from "../../db/schema/jobs";
import { portfolioProjects } from "../../db/schema/portfolios";
import { resumes } from "../../db/schema/resumes";
import { skillMappings } from "../../db/schema/skill-mappings";
import { userProfile } from "../../db/schema/user";
import { DOMAIN_SYSTEM_PROMPTS, GAMING_INDUSTRY_CONTEXT } from "./prompts";

type ContextDomain = "resume" | "job_search" | "interview" | "portfolio" | "skills" | "general";

interface ConversationContext {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
}

export class ConversationContextManager {
  /**
   * Auto-detect domain from message content
   */
  inferDomain(message: string): ContextDomain {
    const lower = message.toLowerCase();
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
  async buildContext(sessionId: string, currentMessage: string): Promise<ConversationContext> {
    const domain = this.inferDomain(currentMessage);

    // Load conversation history (last 20 messages)
    const history = await db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.sessionId, sessionId))
      .orderBy(desc(chatHistory.timestamp))
      .limit(20);

    // Reverse to get chronological order
    const messages = history.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message
    messages.push({ role: "user", content: currentMessage });

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
  private async loadDomainContext(domain: ContextDomain): Promise<string | null> {
    try {
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
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Generate follow-up suggestions based on domain and last response
   */
  generateFollowUps(domain: ContextDomain): string[] {
    const followUps: Record<ContextDomain, string[]> = {
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
