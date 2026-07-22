import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import { generateId } from "@bao/shared/utils/validation";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { skillMappings } from "../db/schema/skill-mappings";
const NUM_50 = 50;

export type SkillMappingInsert = Omit<SkillMapping, "id">;
export type SkillMappingUpdate = Partial<SkillMapping>;
type SkillMappingRow = typeof skillMappings.$inferSelect;

const toSkillMappingInsert = (data: SkillMappingInsert, now: string, id: string) => ({
  id,
  gameExpression: data.gameExpression,
  transferableSkill: data.transferableSkill,
  industryApplications: data.industryApplications || [],
  evidence: data.evidence || [],
  confidence: data.confidence || NUM_50,
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
  return {
    updatedAt: now,
    ...(data.gameExpression !== undefined ? { gameExpression: data.gameExpression } : {}),
    ...(data.transferableSkill !== undefined ? { transferableSkill: data.transferableSkill } : {}),
    ...(data.industryApplications !== undefined
      ? { industryApplications: data.industryApplications }
      : {}),
    ...(data.evidence !== undefined ? { evidence: data.evidence } : {}),
    ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.demandLevel !== undefined ? { demandLevel: data.demandLevel } : {}),
    ...(data.aiGenerated !== undefined ? { aiGenerated: data.aiGenerated } : {}),
  };
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

export async function updateSkillMappingRow(id: string, data: SkillMappingUpdate): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(skillMappings)
    .set(toSkillMappingUpdate(data, now))
    .where(eq(skillMappings.id, id));
}

export async function deleteSkillMappingRow(id: string): Promise<void> {
  await db.delete(skillMappings).where(eq(skillMappings.id, id));
}
