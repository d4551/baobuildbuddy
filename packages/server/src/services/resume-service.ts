import { generateId } from "@bao/shared";
import type { ResumeData } from "@bao/shared";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { resumes } from "../db/schema";

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

    await db.insert(resumes).values({
      id,
      name: data.name || "Untitled Resume",
      personalInfo: data.personalInfo || undefined,
      summary: data.summary || undefined,
      experience: data.experience || [],
      education: data.education || [],
      skills: data.skills || undefined,
      projects: data.projects || [],
      gamingExperience: data.gamingExperience || undefined,
      template: data.template || "modern",
      theme: data.theme || "light",
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    });

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
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.personalInfo !== undefined) updateData.personalInfo = data.personalInfo;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.projects !== undefined) updateData.projects = data.projects;
    if (data.gamingExperience !== undefined) updateData.gamingExperience = data.gamingExperience;
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
    const result = await db.delete(resumes).where(eq(resumes.id, id));
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
