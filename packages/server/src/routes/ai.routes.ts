import { generateId } from "@bao/shared";
import { AI_PROVIDER_CATALOG } from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import {
  SYSTEM_PROMPT,
  coverLetterPrompt,
  jobMatchPrompt,
  resumeEnhancePrompt,
  resumeScorePrompt,
} from "../services/ai/prompts";
import {
  AutomationConcurrencyLimitError,
  AutomationDependencyMissingError,
  AutomationValidationError,
  applicationAutomationService,
} from "../services/automation/application-automation-service";

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const mapAutomationRouteError = (error: unknown) => {
  if (error instanceof AutomationValidationError) {
    return {
      status: HTTP_STATUS_UNPROCESSABLE_ENTITY,
      message: error.message,
    };
  }
  if (error instanceof AutomationDependencyMissingError) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      message: error.message,
    };
  }
  if (error instanceof AutomationConcurrencyLimitError) {
    return {
      status: HTTP_STATUS_CONFLICT,
      message: error.message,
    };
  }
  return {
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    message: error instanceof Error ? error.message : "Failed to start automation",
  };
};

/**
 * Helper function to load settings and create AI service
 */
async function getAIService() {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));

  const settingsRow = settingsRows[0];
  const aiService = AIService.fromSettings(settingsRow);
  return aiService;
}

/**
 * Helper to safely parse JSON from AI responses
 */
function safeJSONParse<T>(jsonString: string, fallback: T): T {
  try {
    // Strip markdown code blocks if present
    const cleaned = jsonString
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse AI JSON response:", error);
    return fallback;
  }
}

const jsonObjectSchema = t.Record(t.String(), t.Any());

const resolveRateLimitClientKey = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) return firstHop;
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp && cloudflareIp.trim().length > 0) {
    return cloudflareIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return new URL(request.url).host;
};

interface ExperienceEntry {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
  achievements?: string[];
  [key: string]: unknown;
}

interface EducationEntry {
  degree?: string;
  institution?: string;
  year?: string;
  [key: string]: unknown;
}

interface ProjectEntry {
  name?: string;
  title?: string;
  description?: string;
  technologies?: string[];
  [key: string]: unknown;
}

/**
 * Loosely-typed resume record coming from the database.
 * We deliberately keep this permissive so that `serializeResume` works
 * regardless of the exact Drizzle row shape.
 */
interface ResumeRecord {
  personalInfo?: Record<string, unknown> | null;
  summary?: string | null;
  experience?: unknown[] | null;
  education?: unknown[] | null;
  skills?: Record<string, unknown> | null;
  projects?: unknown[] | null;
  gamingExperience?: Record<string, unknown> | null;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const collectStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const parseExperienceEntries = (value: unknown[] | null | undefined): ExperienceEntry[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((entry) => ({
        title: asString(entry.title),
        company: asString(entry.company),
        duration: asString(entry.duration),
        description: asString(entry.description),
        achievements: collectStringArray(entry.achievements),
      }))
    : [];

const parseEducationEntries = (value: unknown[] | null | undefined): EducationEntry[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((entry) => ({
        degree: asString(entry.degree),
        institution: asString(entry.institution),
        year: asString(entry.year),
      }))
    : [];

const parseProjectEntries = (value: unknown[] | null | undefined): ProjectEntry[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((entry) => ({
        name: asString(entry.name),
        title: asString(entry.title),
        description: asString(entry.description),
        technologies: collectStringArray(entry.technologies),
      }))
    : [];

/**
 * Serialize resume data to text for AI analysis
 */
function serializeResume(resume: ResumeRecord): string {
  const sections: string[] = [];

  // Personal Info
  if (resume.personalInfo) {
    sections.push("Personal Information:");
    sections.push(JSON.stringify(resume.personalInfo, null, 2));
  }

  // Summary
  if (resume.summary) {
    sections.push("\nSummary:");
    sections.push(resume.summary);
  }

  // Experience
  const experienceEntries = parseExperienceEntries(resume.experience);
  if (experienceEntries.length > 0) {
    sections.push("\nWork Experience:");
    for (const [idx, exp] of Object.entries(experienceEntries)) {
      const index = Number(idx);
      sections.push(`\n${index + 1}. ${exp.title || "Position"} at ${exp.company || "Company"}`);
      if (exp.duration) sections.push(`   Duration: ${exp.duration}`);
      if (exp.description) sections.push(`   ${exp.description}`);
      if (exp.achievements && exp.achievements.length > 0) {
        sections.push("   Achievements:");
        for (const ach of exp.achievements) {
          sections.push(`   - ${ach}`);
        }
      }
    }
  }

  // Education
  const educationEntries = parseEducationEntries(resume.education);
  if (educationEntries.length > 0) {
    sections.push("\nEducation:");
    for (const [idx, edu] of Object.entries(educationEntries)) {
      const index = Number(idx);
      sections.push(
        `${index + 1}. ${edu.degree || "Degree"} - ${edu.institution || "Institution"}`,
      );
      if (edu.year) sections.push(`   Year: ${edu.year}`);
    }
  }

  // Skills
  if (resume.skills) {
    sections.push("\nSkills:");
    sections.push(JSON.stringify(resume.skills, null, 2));
  }

  // Projects
  const projectEntries = parseProjectEntries(resume.projects);
  if (projectEntries.length > 0) {
    sections.push("\nProjects:");
    projectEntries.forEach((proj, idx: number) => {
      sections.push(`\n${idx + 1}. ${proj.name || proj.title || "Project"}`);
      if (proj.description) sections.push(`   ${proj.description}`);
      if (proj.technologies && proj.technologies.length > 0) {
        sections.push(`   Technologies: ${proj.technologies.join(", ")}`);
      }
    });
  }

  // Gaming Experience
  if (resume.gamingExperience) {
    sections.push("\nGaming Experience:");
    sections.push(JSON.stringify(resume.gamingExperience, null, 2));
  }

  return sections.join("\n");
}

/**
 * AI route group for chat, content generation, matching, and automation triggers.
 */
export const aiRoutes = new Elysia({ prefix: "/ai" })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: 60000,
      max: 25,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .post(
    "/chat",
    async ({ body, set }) => {
      const { message, sessionId = "default" } = body;

      try {
        // Save user message
        const userMsg = {
          id: generateId(),
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
          sessionId,
        };
        await db.insert(chatHistory).values(userMsg);

        // Load AI service
        const aiService = await getAIService();

        // Generate AI response
        const response = await aiService.generate(message, {
          systemPrompt: SYSTEM_PROMPT,
          temperature: 0.7,
          maxTokens: 2000,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Save AI response
        const aiResponse = {
          id: generateId(),
          role: "assistant",
          content: response.content,
          timestamp: new Date().toISOString(),
          sessionId,
        };
        await db.insert(chatHistory).values(aiResponse);

        return {
          message: aiResponse.content,
          sessionId,
          timestamp: aiResponse.timestamp,
          provider: response.provider,
          model: response.model,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : "Failed to generate AI response",
        };
      }
    },
    {
      body: t.Object({
        message: t.String({ maxLength: 10000 }),
        sessionId: t.Optional(t.String({ maxLength: 100 })),
        context: t.Optional(jsonObjectSchema),
      }),
    },
  )
  .post(
    "/analyze-resume",
    async ({ body, set }) => {
      const { resumeId, jobId } = body;

      try {
        // Load resume
        const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));

        if (resumeRows.length === 0) {
          set.status = 404;
          return { error: "Resume not found" };
        }

        const resume = resumeRows[0];
        const resumeText = serializeResume(resume);

        // Load job if provided
        let jobDescription = "";
        if (jobId) {
          const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));

          if (jobRows.length > 0) {
            const job = jobRows[0];
            jobDescription = `
Title: ${job.title}
Company: ${job.company}
Description: ${job.description || ""}
Requirements: ${job.requirements?.join(", ") || ""}
Technologies: ${job.technologies?.join(", ") || ""}
          `.trim();
          }
        }

        // Load AI service
        const aiService = await getAIService();

        // Choose prompt based on whether we have a job
        const prompt =
          jobId && jobDescription
            ? `${resumeScorePrompt(resumeText, jobDescription)}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), improvements (string[]), keywords (string[]).`
            : `${resumeEnhancePrompt(resumeText)}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), improvements (string[]), keywords (string[]).`;

        // Generate analysis
        const response = await aiService.generate(prompt, {
          temperature: 0.3,
          maxTokens: 2000,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Parse JSON response
        const analysis = safeJSONParse(response.content, {
          score: 70,
          strengths: ["Well-formatted resume"],
          improvements: ["Add more specific achievements", "Include relevant keywords"],
          keywords: [],
        });

        return {
          message: "Resume analysis complete",
          resumeId,
          jobId: jobId || null,
          analysis: {
            score: analysis.score || 70,
            strengths: analysis.strengths || [],
            improvements: analysis.improvements || [],
            keywords: analysis.keywords || [],
          },
          provider: response.provider,
          model: response.model,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : "Failed to analyze resume",
        };
      }
    },
    {
      body: t.Object({
        resumeId: t.String({ maxLength: 100 }),
        jobId: t.Optional(t.String({ maxLength: 100 })),
      }),
    },
  )
  .post(
    "/generate-cover-letter",
    async ({ body, set }) => {
      const { resumeId, jobId, company, position } = body;

      try {
        // Load resume
        const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));

        if (resumeRows.length === 0) {
          set.status = 404;
          return { error: "Resume not found" };
        }

        const resume = resumeRows[0];
        const resumeText = serializeResume(resume);

        // Load job description if provided
        let jobDescription = "No specific job description provided.";
        if (jobId) {
          const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));

          if (jobRows.length > 0) {
            const job = jobRows[0];
            jobDescription = job.description || jobDescription;
          }
        }

        // Load AI service
        const aiService = await getAIService();

        // Generate cover letter
        const prompt = coverLetterPrompt(company, position, jobDescription, resumeText);

        const response = await aiService.generate(prompt, {
          temperature: 0.7,
          maxTokens: 2000,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Parse JSON response
        const coverLetter = safeJSONParse(response.content, {
          introduction: "I am excited to apply for this position.",
          body: "My experience and skills make me a strong candidate for this role.",
          conclusion: "I look forward to discussing this opportunity with you.",
        });

        return {
          message: "Cover letter generated successfully",
          content: {
            introduction: coverLetter.introduction || "I am excited to apply for this position.",
            body: coverLetter.body || "My experience and skills make me a strong candidate.",
            conclusion: coverLetter.conclusion || "I look forward to discussing this opportunity.",
          },
          provider: response.provider,
          model: response.model,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : "Failed to generate cover letter",
        };
      }
    },
    {
      body: t.Object({
        resumeId: t.String({ maxLength: 100 }),
        jobId: t.Optional(t.String({ maxLength: 100 })),
        company: t.String({ maxLength: 200 }),
        position: t.String({ maxLength: 200 }),
      }),
    },
  )
  .post(
    "/match-jobs",
    async ({ body, set }) => {
      const { resumeId, skills } = body;

      try {
        // Load user profile
        const profileRows = await db
          .select()
          .from(userProfile)
          .where(eq(userProfile.id, "default"));

        let userSkills: string[] = skills || [];
        let experience = "";
        let goals = "";

        if (profileRows.length > 0) {
          const profile = profileRows[0];
          userSkills = skills || [
            ...(profile.technicalSkills || []),
            ...(profile.softSkills || []),
          ];
          experience = profile.summary || "";
          goals = profile.careerGoals ? JSON.stringify(profile.careerGoals) : "";
        }

        // If resume is provided, load it for more context
        if (resumeId) {
          const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));

          if (resumeRows.length > 0) {
            const resume = resumeRows[0];
            if (resume.summary) experience = resume.summary;
            if (resume.skills) {
              const resumeSkills = Object.values(resume.skills).flatMap((value) =>
                collectStringArray(value),
              );
              userSkills = [...new Set([...userSkills, ...resumeSkills])];
            }
          }
        }

        // Load recent jobs (limit to 10 for performance)
        const recentJobs = await db.select().from(jobs).orderBy(desc(jobs.postedDate)).limit(10);

        if (recentJobs.length === 0) {
          return {
            message: "No jobs available for matching",
            matches: [],
            recommendations: [],
          };
        }

        // Load AI service
        const aiService = await getAIService();

        // Analyze matches for each job
        const matches = await Promise.all(
          recentJobs.slice(0, 5).map(async (job) => {
            const prompt = `${jobMatchPrompt(
              {
                skills: userSkills,
                experience,
                goals,
              },
              {
                title: job.title,
                company: job.company,
                description: job.description || "",
                requirements: job.requirements || [],
              },
            )}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), concerns (string[]), highlightSkills (string[]).`;

            try {
              const response = await aiService.generate(prompt, {
                temperature: 0.3,
                maxTokens: 1000,
              });

              if (response.error) {
                return {
                  jobId: job.id,
                  title: job.title,
                  company: job.company,
                  score: 50,
                  strengths: [],
                  concerns: [],
                  highlightSkills: [],
                };
              }

              const analysis = safeJSONParse(response.content, {
                score: 50,
                strengths: [],
                concerns: [],
                highlightSkills: [],
              });

              return {
                jobId: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                remote: job.remote,
                score: analysis.score || 50,
                strengths: analysis.strengths || [],
                concerns: analysis.concerns || [],
                highlightSkills: analysis.highlightSkills || [],
              };
            } catch (error) {
              console.error(`Failed to analyze job ${job.id}:`, error);
              return {
                jobId: job.id,
                title: job.title,
                company: job.company,
                score: 50,
                strengths: [],
                concerns: [],
                highlightSkills: [],
              };
            }
          }),
        );

        // Sort by score
        matches.sort((a, b) => b.score - a.score);

        // Generate recommendations
        const topMatch = matches[0];
        const recommendations = topMatch
          ? [
              `Apply to ${topMatch.title} at ${topMatch.company} (${topMatch.score}% match)`,
              ...topMatch.strengths.slice(0, 2),
            ]
          : [];

        return {
          message: "Job matching complete",
          matches,
          recommendations,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: error instanceof Error ? error.message : "Failed to match jobs",
        };
      }
    },
    {
      body: t.Object({
        resumeId: t.Optional(t.String({ maxLength: 100 })),
        skills: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 100 })),
        preferences: t.Optional(jsonObjectSchema),
      }),
    },
  )
  .get("/models", async () => {
    try {
      // Load AI service to get real provider status
      const aiService = await getAIService();

      // Get provider statuses
      const providerStatuses = await aiService.getAvailableProviders();
      const statusByProvider = new Map(providerStatuses.map((status) => [status.provider, status]));

      // Detect local provider connectivity by attempting to list local models.
      const localProviders = await aiService.detectLocalProviders();
      const localProviderAvailable = localProviders.some((provider) => provider.available);

      // Map providers from shared catalog to response format
      const providers = AI_PROVIDER_CATALOG.map((provider) => {
        const status = statusByProvider.get(provider.id);
        const available =
          provider.id === "local"
            ? (status?.available ?? localProviderAvailable)
            : status?.available;

        return {
          id: provider.id,
          name: provider.name,
          models: [...provider.modelHints],
          available: available ?? false,
          health: status?.health ?? (available ? "healthy" : "unconfigured"),
        };
      });

      return {
        providers,
        preferredProvider: aiService.getFallbackOrder()[0],
        configuredProviders: aiService.getConfiguredProviders(),
      };
    } catch {
      // If settings not found or no providers configured, return default list
      const providers = AI_PROVIDER_CATALOG.map((provider) => ({
        id: provider.id,
        name: provider.name,
        models: [...provider.modelHints],
        available: false,
        health: "unconfigured" as const,
      }));
      return {
        providers,
        error: "No AI providers configured. Please add API keys in settings.",
      };
    }
  })
  .get("/usage", async () => {
    const chatMessages = await db.select().from(chatHistory);

    return {
      totalMessages: chatMessages.length,
      userMessages: chatMessages.filter((m) => m.role === "user").length,
      assistantMessages: chatMessages.filter((m) => m.role === "assistant").length,
      sessions: [...new Set(chatMessages.map((m) => m.sessionId))].length,
      recentActivity: chatMessages.slice(-10).map((m) => ({
        timestamp: m.timestamp,
        role: m.role,
        sessionId: m.sessionId,
      })),
    };
  })
  .post(
    "/automation-action",
    async ({ body, set }) => {
      const { action, jobUrl, resumeId, coverLetterId, jobId } = body;

      if (action !== "job_apply") {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return { error: `Unsupported automation action: ${action}` };
      }

      try {
        const runId = await applicationAutomationService.createJobApplyRun(
          { jobUrl, resumeId, coverLetterId, jobId },
          { includeActionInPayload: true },
        );

        void applicationAutomationService.runJobApply(runId, {
          jobUrl,
          resumeId,
          coverLetterId,
          jobId,
        });

        return {
          runId,
          status: "running",
          message:
            "Job application automation started. Use GET /api/automation/runs/:id to check status.",
        };
      } catch (error) {
        const mapped = mapAutomationRouteError(error);
        set.status = mapped.status;
        return {
          error: mapped.message,
        };
      }
    },
    {
      body: t.Object({
        action: t.String({ maxLength: 50 }),
        jobUrl: t.String({ minLength: 1, maxLength: 2000 }),
        resumeId: t.String({ maxLength: 100 }),
        coverLetterId: t.Optional(t.String({ maxLength: 100 })),
        jobId: t.Optional(t.String({ maxLength: 100 })),
      }),
    },
  );
