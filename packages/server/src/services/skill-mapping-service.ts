import { API_ERROR_CREATE_SKILL_MAPPING } from "@bao/shared/constants/api-errors";
import type {
  CareerPathway,
  ReadinessAssessment,
  SkillMapping,
} from "@bao/shared/types/skill-mapping";
import { skillMappingFromRow } from "./skill-mapping-normalizers";
import { buildCareerPathways } from "./skill-mapping-pathways";
import { buildSkillReadinessAssessment } from "./skill-mapping-readiness";
import {
  createSkillMappingRow,
  deleteSkillMappingRow,
  listSkillMappingRows,
  readSkillMappingRow,
  updateSkillMappingRow,
} from "./skill-mapping-storage";

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
}

export const skillMappingService = new SkillMappingService();
