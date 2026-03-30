import type { SkillMapping } from "@bao/shared";
import { generateId } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { skillMappings } from "../db/schema/skill-mappings";

export type SkillMappingInsert = Omit<SkillMapping, "id">;
export type SkillMappingUpdate = Partial<SkillMapping>;
type SkillMappingRow = typeof skillMappings.$inferSelect;

const toSkillMappingInsert = (data: SkillMappingInsert, now: string, id: string) => ({
  id,
  gameExpression: data.gameExpression,
  transferableSkill: data.transferableSkill,
  industryApplications: data.industryApplications || [],
  evidence: data.evidence || [],
  confidence: data.confidence || 50,
  category: data.category,
  demandLevel: data.demandLevel,
  aiGenerated: data.aiGenerated,
  createdAt: now,
  updatedAt: now,
});

const toSkillMappingUpdate = (
  data: SkillMappingUpdate,
  now: string,
): Partial<typeof skillMappings.$inferInsert> => {
  const updateData: Partial<typeof skillMappings.$inferInsert> = {
    updatedAt: now,
  };

  if (data.gameExpression !== undefined) updateData.gameExpression = data.gameExpression;
  if (data.transferableSkill !== undefined) updateData.transferableSkill = data.transferableSkill;
  if (data.industryApplications !== undefined) {
    updateData.industryApplications = data.industryApplications;
  }
  if (data.evidence !== undefined) updateData.evidence = data.evidence;
  if (data.confidence !== undefined) updateData.confidence = data.confidence;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.demandLevel !== undefined) updateData.demandLevel = data.demandLevel;
  if (data.aiGenerated !== undefined) updateData.aiGenerated = data.aiGenerated;

  return updateData;
};

export async function listSkillMappingRows(): Promise<SkillMappingRow[]> {
  return db.select().from(skillMappings);
}

export async function readSkillMappingRow(id: string): Promise<SkillMappingRow | null> {
  const results = await db.select().from(skillMappings).where(eq(skillMappings.id, id));
  return results[0] ?? null;
}

export async function createSkillMappingRow(data: SkillMappingInsert): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.insert(skillMappings).values(toSkillMappingInsert(data, now, id));
  return id;
}

export async function updateSkillMappingRow(
  id: string,
  data: SkillMappingUpdate,
): Promise<void> {
  const now = new Date().toISOString();
  await db.update(skillMappings).set(toSkillMappingUpdate(data, now)).where(eq(skillMappings.id, id));
}

export async function deleteSkillMappingRow(id: string): Promise<void> {
  await db.delete(skillMappings).where(eq(skillMappings.id, id));
}
