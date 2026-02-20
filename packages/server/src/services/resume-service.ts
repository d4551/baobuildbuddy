import { generateId } from "@bao/shared";
import type { GamingExperience, ResumeData, ResumePersonalInfo, ResumeSkills } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { resumes } from "../db/schema";

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

export class ResumeService {
  /**
   * Get all resumes
   */
  async getResumes(): Promise<ResumeData[]> {
    const results = await db.select().from(resumes);

    return results.map((row) => ({
      id: row.id,
      name: row.name || undefined,
      personalInfo: row.personalInfo || undefined,
      summary: row.summary || undefined,
      experience: (row.experience || []) as ResumeData["experience"],
      education: (row.education || []) as ResumeData["education"],
      skills: row.skills || undefined,
      projects: (row.projects || []) as ResumeData["projects"],
      gamingExperience: row.gamingExperience || undefined,
      template: this.normalizeTemplate(row.template),
      theme: this.normalizeTheme(row.theme),
      isDefault: row.isDefault || false,
    }));
  }

  /**
   * Get a single resume by ID
   */
  async getResume(id: string): Promise<ResumeData | null> {
    const results = await db.select().from(resumes).where(eq(resumes.id, id));

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      name: row.name || undefined,
      personalInfo: row.personalInfo || undefined,
      summary: row.summary || undefined,
      experience: (row.experience || []) as ResumeData["experience"],
      education: (row.education || []) as ResumeData["education"],
      skills: row.skills || undefined,
      projects: (row.projects || []) as ResumeData["projects"],
      gamingExperience: row.gamingExperience || undefined,
      template: this.normalizeTemplate(row.template),
      theme: this.normalizeTheme(row.theme),
      isDefault: row.isDefault || false,
    };
  }

  /**
   * Create a new resume
   */
  async createResume(data: Omit<ResumeData, "id">): Promise<ResumeData> {
    const id = generateId();
    const now = new Date().toISOString();

    const insertPayload: typeof resumes.$inferInsert = {
      id,
      name: data.name || "Untitled Resume",
      personalInfo: toPersonalInfoRecord(data.personalInfo),
      summary: data.summary || undefined,
      experience: data.experience || [],
      education: data.education || [],
      skills: toSkillsRecord(data.skills),
      projects: data.projects || [],
      gamingExperience: toGamingExperienceRecord(data.gamingExperience),
      template: data.template || "modern",
      theme: data.theme || "light",
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
    if (!template) return "modern";
    const valid = ["modern", "classic", "creative", "minimal", "gaming"] as const;
    return valid.includes(template as (typeof valid)[number])
      ? (template as (typeof valid)[number])
      : "modern";
  }

  private normalizeTheme(theme: string | null): ResumeData["theme"] {
    if (theme === "dark") return "dark";
    return "light";
  }
}

export const resumeService = new ResumeService();
