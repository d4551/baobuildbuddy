import { API_ERROR_CREATE_SKILL_MAPPING } from "@bao/shared/constants/api-errors";
import type {
  CareerPathway,
  ReadinessAssessment,
  SkillMapping,
} from "@bao/shared/types/skill-mapping";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { skillMappingFromRow } from "./skill-mapping-normalizers";
import { buildCareerPathways } from "./skill-mapping-pathways";
import {
  buildSkillReadinessAssessment,
  buildSkillReadinessAssessmentForJob,
  type ReadinessJobTarget,
} from "./skill-mapping-readiness";
import {
  createSkillMappingRow,
  deleteSkillMappingRow,
  listSkillMappingRows,
  readSkillMappingRow,
  updateSkillMappingRow,
} from "./skill-mapping-storage";

const toReadinessJobTarget = (job: typeof jobs.$inferSelect): ReadinessJobTarget => ({
  id: job.id,
  title: job.title,
  requirements: Array.isArray(job.requirements) ? job.requirements : [],
  technologies: Array.isArray(job.technologies) ? job.technologies : [],
});

export class SkillMappingService {
  async getMappings(): Promise<SkillMapping[]> {
    const rows = await listSkillMappingRows();
    return rows.map(skillMappingFromRow);
  }

  async createMapping(data: Omit<SkillMapping, "id">): Promise<SkillMapping> {
    const id = await createSkillMappingRow(data);
    const created = await this.getMapping(id);
    if (!created) {
      throw new Error(API_ERROR_CREATE_SKILL_MAPPING);
    }

    return created;
  }

  async getMapping(id: string): Promise<SkillMapping | null> {
    const row = await readSkillMappingRow(id);
    return row ? skillMappingFromRow(row) : null;
  }

  async updateMapping(id: string, data: Partial<SkillMapping>): Promise<SkillMapping | null> {
    const existing = await this.getMapping(id);
    if (!existing) {
      return null;
    }

    await updateSkillMappingRow(id, data);
    return this.getMapping(id);
  }

  async deleteMapping(id: string): Promise<boolean> {
    const existing = await this.getMapping(id);
    if (!existing) {
      return false;
    }

    await deleteSkillMappingRow(id);
    return true;
  }

  async getPathways(): Promise<CareerPathway[]> {
    const mappings = await this.getMappings();
    return buildCareerPathways(mappings);
  }

  async getReadiness(): Promise<ReadinessAssessment> {
    const mappings = await this.getMappings();
    return buildSkillReadinessAssessment(mappings);
  }

  async getReadinessForJob(jobId: string): Promise<ReadinessAssessment | null> {
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    const jobRow = jobRows[0];
    if (!jobRow) {
      return null;
    }
    const mappings = await this.getMappings();
    return buildSkillReadinessAssessmentForJob(mappings, toReadinessJobTarget(jobRow));
  }
}

export const skillMappingService = new SkillMappingService();
