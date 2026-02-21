import {
  RESUME_TEMPLATE_DEFAULT,
  RESUME_DEFAULT_NAME,
  RESUME_DEFAULT_THEME,
  generateId,
  isResumeTemplate,
  resumeEducationSchema,
  resumeExperienceSchema,
  resumeGamingExperienceSchema,
  resumePersonalInfoSchema,
  resumeProjectSchema,
  resumeSkillsSchema,
} from "@bao/shared";
import type { GamingExperience, ResumeData, ResumePersonalInfo, ResumeSkills } from "@bao/shared";
import * as z from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { resumes } from "../db/schema";

const resumeExperienceArraySchema = z.array(resumeExperienceSchema);
const resumeEducationArraySchema = z.array(resumeEducationSchema);
const resumeProjectArraySchema = z.array(resumeProjectSchema);

const toResumeSummary = (value: string | null | undefined): string => value ?? "";

const parseOrDefault = <T>(schema: z.ZodType<T>, value: unknown, fallback: T): T => {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
};

const toRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

const toPersonalInfoRecord = (
  value: ResumePersonalInfo | undefined,
): Record<string, unknown> | undefined => (value ? toRecord(value) : undefined);

const toSkillsRecord = (value: ResumeSkills | undefined): Record<string, unknown> | undefined =>
  value ? toRecord(value) : undefined;

const toGamingExperienceRecord = (
  value: GamingExperience | undefined,
): Record<string, unknown> | undefined => (value ? toRecord(value) : undefined);

/**
 * Resume persistence service with validation and normalization from storage records.
 */
export class ResumeService {
  private toResumeData(row: typeof resumes.$inferSelect): ResumeData {
    const experience: ResumeData["experience"] = parseOrDefault(
      resumeExperienceArraySchema,
      row.experience,
      [],
    );
    const education: ResumeData["education"] = parseOrDefault(
      resumeEducationArraySchema,
      row.education,
      [],
    );
    const projects: ResumeData["projects"] = parseOrDefault(
      resumeProjectArraySchema,
      row.projects,
      [],
    );

    return {
      id: row.id,
      name: parseOrDefault(z.string().min(1), row.name, RESUME_DEFAULT_NAME),
      personalInfo: parseOrDefault(
        resumePersonalInfoSchema.optional(),
        row.personalInfo,
        undefined,
      ),
      summary: toResumeSummary(row.summary),
      experience,
      education,
      skills: parseOrDefault(resumeSkillsSchema.optional(), row.skills, undefined),
      projects,
      gamingExperience: parseOrDefault(
        resumeGamingExperienceSchema.optional(),
        row.gamingExperience,
        undefined,
      ),
      template: this.normalizeTemplate(row.template),
      theme: this.normalizeTheme(row.theme),
      isDefault: parseOrDefault(z.boolean(), row.isDefault, false),
    };
  }

  /**
   * Get all resumes
   */
  async getResumes(): Promise<ResumeData[]> {
    const results = await db.select().from(resumes);
    return results.map((row) => this.toResumeData(row));
  }

  /**
   * Get a single resume by ID
   */
  async getResume(id: string): Promise<ResumeData | null> {
    const results = await db.select().from(resumes).where(eq(resumes.id, id));

    if (results.length === 0) {
      return null;
    }

    return this.toResumeData(results[0]);
  }

  /**
   * Create a new resume
   */
  async createResume(data: Omit<ResumeData, "id">): Promise<ResumeData> {
    const id = generateId();
    const now = new Date().toISOString();

    const insertPayload: typeof resumes.$inferInsert = {
      id,
      name: data.name || RESUME_DEFAULT_NAME,
      personalInfo: toPersonalInfoRecord(data.personalInfo),
      ...(data.summary ? { summary: data.summary } : {}),
      experience: data.experience || [],
      education: data.education || [],
      skills: toSkillsRecord(data.skills),
      projects: data.projects || [],
      gamingExperience: toGamingExperienceRecord(data.gamingExperience),
      template: data.template || RESUME_TEMPLATE_DEFAULT,
      theme: data.theme || RESUME_DEFAULT_THEME,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(resumes).values(insertPayload);

    const created = await this.getResume(id);
    if (!created) {
      throw new Error("Failed to create resume");
    }

    return created;
  }

  /**
   * Update an existing resume
   */
  async updateResume(id: string, data: Partial<ResumeData>): Promise<ResumeData | null> {
    const existing = await this.getResume(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData: Partial<typeof resumes.$inferInsert> = {
      updatedAt: now,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.personalInfo !== undefined) {
      updateData.personalInfo = toPersonalInfoRecord(data.personalInfo);
    }
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.skills !== undefined) updateData.skills = toSkillsRecord(data.skills);
    if (data.projects !== undefined) updateData.projects = data.projects;
    if (data.gamingExperience !== undefined) {
      updateData.gamingExperience = toGamingExperienceRecord(data.gamingExperience);
    }
    if (data.template !== undefined) updateData.template = data.template;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    await db.update(resumes).set(updateData).where(eq(resumes.id, id));

    return await this.getResume(id);
  }

  /**
   * Delete a resume by ID
   */
  async deleteResume(id: string): Promise<boolean> {
    await db.delete(resumes).where(eq(resumes.id, id));
    return true;
  }

  /**
   * Set a resume as default, unmarking all others
   */
  async setDefaultResume(id: string): Promise<ResumeData | null> {
    const existing = await this.getResume(id);
    if (!existing) {
      return null;
    }

    // Unmark all resumes as default
    await db.update(resumes).set({ isDefault: false });

    // Mark this one as default
    await db
      .update(resumes)
      .set({ isDefault: true, updatedAt: new Date().toISOString() })
      .where(eq(resumes.id, id));

    return await this.getResume(id);
  }

  private normalizeTemplate(template: string | null): ResumeData["template"] {
    return isResumeTemplate(template) ? template : RESUME_TEMPLATE_DEFAULT;
  }

  private normalizeTheme(theme: string | null): ResumeData["theme"] {
    if (theme === "dark") return "dark";
    return RESUME_DEFAULT_THEME;
  }
}

/**
 * Shared singleton instance for resume CRUD operations.
 */
export const resumeService = new ResumeService();
