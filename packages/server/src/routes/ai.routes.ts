import { generateId } from "@navi/shared";
import { AI_PROVIDER_CATALOG } from "@navi/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import {
  SYSTEM_PROMPT,
  coverLetterPrompt,
  jobMatchPrompt,
  resumeEnhancePrompt,
  resumeScorePrompt,
} from "../services/ai/prompts";

/**
 * Helper function to load settings and create AI service
 */
async function getAIService() {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, "default"));

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

/**
 * Serialize resume data to text for AI analysis
 */
function serializeResume(resume: unknown): string {
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
  if (resume.experience && resume.experience.length > 0) {
    sections.push("\nWork Experience:");
    for (const [idx, exp] of Object.entries(resume.experience)) {
      const index = Number(idx);
      sections.push(`\n${index + 1}. ${exp.title || "Position"} at ${exp.company || "Company"}`);
      if (exp.duration) sections.push(`   Duration: ${exp.duration}`);
      if (exp.description) sections.push(`   ${exp.description}`);
      if (exp.achievements) {
        sections.push("   Achievements:");
        for (const ach of exp.achievements) {
          sections.push(`   - ${ach}`);
        }
      }
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    sections.push("\nEducation:");
    for (const [idx, edu] of Object.entries(resume.education)) {
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
  if (resume.projects && resume.projects.length > 0) {
    sections.push("\nProjects:");
    resume.projects.forEach((proj: unknown, idx: number) => {
      sections.push(`\n${idx + 1}. ${proj.name || "Project"}`);
      if (proj.description) sections.push(`   ${proj.description}`);
      if (proj.technologies) sections.push(`   Technologies: ${proj.technologies.join(", ")}`);
    });
  }

  // Gaming Experience
  if (resume.gamingExperience) {
    sections.push("\nGaming Experience:");
    sections.push(JSON.stringify(resume.gamingExperience, null, 2));
  }

  return sections.join("\n");
}

export const aiRoutes = new Elysia({ prefix: "/ai" })
  .use(rateLimit({ scoping: "scoped", duration: 60000, max: 25 }))
  .post(
    "/chat",
    async ({ body, set }) => {
      const { message, sessionId = "default", context } = body;

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
        context: t.Optional(t.Record(t.String(), t.Any())),
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
        const prompt = `${coverLetterPrompt(resumeText, {
          title: position,
          company,
          description: jobDescription,
        })}\n\nRespond with a JSON object containing: introduction (string), body (string), conclusion (string).`;

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
      const { resumeId, skills, preferences } = body;

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
              const resumeSkills = Object.values(resume.skills).flat() as string[];
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
        preferences: t.Optional(t.Record(t.String(), t.Any())),
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
    } catch (error) {
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
  });
