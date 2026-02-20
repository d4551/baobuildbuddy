import { generateId } from "@bao/shared";
import type { CoverLetterData, CoverLetterTemplate } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema";

const COVER_LETTER_TEMPLATES: readonly CoverLetterTemplate[] = [
  "professional",
  "creative",
  "gaming",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCoverLetterContent = (value: unknown): CoverLetterData["content"] => {
  if (!isRecord(value)) {
    return {};
  }
  const content: CoverLetterData["content"] = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      content[key] = entry;
    }
  }
  return content;
};

const toContentRecord = (value: CoverLetterData["content"] | undefined): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  if (!value) return record;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      record[key] = entry;
    }
  }
  return record;
};

const normalizeTemplate = (value: string | null | undefined): CoverLetterTemplate =>
  value && COVER_LETTER_TEMPLATES.includes(value as CoverLetterTemplate)
    ? (value as CoverLetterTemplate)
    : "professional";

export class CoverLetterService {
  /**
   * Get all cover letters
   */
  async getCoverLetters(): Promise<CoverLetterData[]> {
    const results = await db.select().from(coverLetters);

    return results.map((row) => ({
      id: row.id,
      company: row.company,
      position: row.position,
      jobInfo: row.jobInfo || undefined,
      content: toCoverLetterContent(row.content),
      template: normalizeTemplate(row.template),
    }));
  }

  /**
   * Get a single cover letter by ID
   */
  async getCoverLetter(id: string): Promise<CoverLetterData | null> {
    const results = await db.select().from(coverLetters).where(eq(coverLetters.id, id));

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      company: row.company,
      position: row.position,
      jobInfo: row.jobInfo || undefined,
      content: toCoverLetterContent(row.content),
      template: normalizeTemplate(row.template),
    };
  }

  /**
   * Create a new cover letter
   */
  async createCoverLetter(data: Omit<CoverLetterData, "id">): Promise<CoverLetterData> {
    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(coverLetters).values({
      id,
      company: data.company,
      position: data.position,
      jobInfo: data.jobInfo || undefined,
      content: toContentRecord(data.content),
      template: normalizeTemplate(data.template),
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getCoverLetter(id);
    if (!created) {
      throw new Error("Failed to create cover letter");
    }

    return created;
  }

  /**
   * Update an existing cover letter
   */
  async updateCoverLetter(
    id: string,
    data: Partial<CoverLetterData>,
  ): Promise<CoverLetterData | null> {
    const existing = await this.getCoverLetter(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData: Partial<typeof coverLetters.$inferInsert> = {
      updatedAt: now,
    };

    if (data.company !== undefined) updateData.company = data.company;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.jobInfo !== undefined) updateData.jobInfo = data.jobInfo;
    if (data.content !== undefined) updateData.content = toContentRecord(data.content);
    if (data.template !== undefined) updateData.template = normalizeTemplate(data.template);

    await db.update(coverLetters).set(updateData).where(eq(coverLetters.id, id));

    return await this.getCoverLetter(id);
  }

  /**
   * Delete a cover letter by ID
   */
  async deleteCoverLetter(id: string): Promise<boolean> {
    const result = await db.delete(coverLetters).where(eq(coverLetters.id, id));
    return true;
  }
}

export const coverLetterService = new CoverLetterService();
