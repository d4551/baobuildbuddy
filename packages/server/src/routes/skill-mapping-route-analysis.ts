import { AI_DEFAULT_TEMPERATURE_CREATIVE } from "@bao/shared/constants/ai-generation";
import { API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_SKILL_ANALYSIS_COMPLETE } from "@bao/shared/constants/api-messages";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@bao/shared/constants/http";
import { SCHEMA_MAX_LENGTH_LONG } from "@bao/shared/constants/schema-limits";
import { parseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { isRecord } from "@bao/shared/utils/type-guards";
import { z } from "zod";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { AIService } from "../services/ai/ai-service";
import { skillAnalysisPrompt } from "../services/ai/prompts-career";
import { skillMappingService } from "../services/skill-mapping-service";
import { createServerLogger } from "../utils/logger";
import type { SkillAnalyzeBody, SkillMappingRouteSetState } from "./skill-mapping-route-contracts";
import {
  mapSuggestedMappingToCreateInput,
  normalizeStringArray,
} from "./skill-mapping-route-normalizers";

type SkillAnalysisResponse = {
  message: string;
  detectedSkills: string[];
  suggestedMappings: Record<string, unknown>[];
  recommendations: string[];
  provider?: string;
};

const skillMappingRoutesLogger = createServerLogger("skill-mapping-routes");
const SKILL_ANALYSIS_JSON_REGEX = /\{[\s\S]*\}/;

const emptySkillAnalysisResponse = (message: string): SkillAnalysisResponse => ({
  message,
  detectedSkills: [],
  suggestedMappings: [],
  recommendations: [],
});

const collectSkillsToAnalyze = (body: SkillAnalyzeBody): string[] => {
  const skillsToAnalyze: string[] = [];
  if (body.gameExperience) {
    const gameExperience = isRecord(body.gameExperience) ? body.gameExperience : {};
    skillsToAnalyze.push(...normalizeStringArray(gameExperience.skills));
    skillsToAnalyze.push(...normalizeStringArray(gameExperience.achievements));
    skillsToAnalyze.push(...normalizeStringArray(gameExperience.roles));
  }
  if (body.resume) {
    const resume = isRecord(body.resume) ? body.resume : {};
    skillsToAnalyze.push(...normalizeStringArray(resume.skills));
    if (typeof resume.experience === "string") {
      skillsToAnalyze.push(resume.experience);
    }
  }
  return skillsToAnalyze;
};

const parseSkillAnalysisContent = (content: string): Record<string, unknown> => {
  const parsedResult: Record<string, unknown> = {
    detectedSkills: [],
    suggestedMappings: [],
    recommendations: [],
  };
  const jsonMatch = content.match(SKILL_ANALYSIS_JSON_REGEX);
  if (!jsonMatch) {
    parsedResult.recommendations = [content];
    return parsedResult;
  }

  const parsed = parseJson(jsonMatch[0], z.record(z.string(), z.unknown()));
  if (!parsed) {
    parsedResult.recommendations = [content];
    return parsedResult;
  }
  return parsed;
};

const normalizeSuggestedMappings = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
};

const autoCreateSuggestedMappings = async (suggestedMappings: Record<string, unknown>[]) => {
  const createOperations = suggestedMappings
    .map((suggestedMapping) => mapSuggestedMappingToCreateInput(suggestedMapping))
    .filter(
      (payload): payload is NonNullable<ReturnType<typeof mapSuggestedMappingToCreateInput>> =>
        payload !== null,
    )
    .map((payload) => settle(skillMappingService.createMapping(payload)));

  const createResults = await Promise.all(createOperations);
  for (const createResult of createResults) {
    if (createResult.status === "rejected") {
      skillMappingRoutesLogger.error("Failed to auto-create mapping:", createResult.reason);
    }
  }
};

export const analyzeSkillMappingsSafely = async (
  body: SkillAnalyzeBody,
  set: SkillMappingRouteSetState,
) => {
  const analysisResult = await settle(analyzeSkillMappings(body, set));
  if (analysisResult.status === "rejected") {
    skillMappingRoutesLogger.error("AI analysis error:", analysisResult.reason);
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      message: `Error during AI analysis: ${analysisResult.reason instanceof Error ? analysisResult.reason.message : API_ERROR_UNKNOWN}`,
      detectedSkills: [],
      suggestedMappings: [],
      recommendations: [],
    };
  }
  return analysisResult.value;
};

const analyzeSkillMappings = async (
  body: SkillAnalyzeBody,
  set: SkillMappingRouteSetState,
): Promise<SkillAnalysisResponse> => {
  const settingsRows = await db.select().from(settings).limit(1);
  const aiService = AIService.fromSettings(settingsRows[0]);
  const skillsToAnalyze = collectSkillsToAnalyze(body);
  if (skillsToAnalyze.length === 0) {
    return emptySkillAnalysisResponse("No skills found in the provided data");
  }

  const response = await aiService.generate(skillAnalysisPrompt(skillsToAnalyze), {
    purpose: "jobMatch",
    temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
    maxTokens: SCHEMA_MAX_LENGTH_LONG,
  });
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return emptySkillAnalysisResponse(`AI analysis failed: ${response.error}`);
  }

  const parsedAnalysis = parseSkillAnalysisContent(response.content);
  const suggestedMappings = normalizeSuggestedMappings(parsedAnalysis.suggestedMappings);
  if (body.autoCreateMappings) {
    await autoCreateSuggestedMappings(suggestedMappings);
  }

  return {
    message: API_MESSAGE_SKILL_ANALYSIS_COMPLETE,
    detectedSkills: normalizeStringArray(parsedAnalysis.detectedSkills),
    suggestedMappings,
    recommendations: normalizeStringArray(parsedAnalysis.recommendations),
    provider: response.provider,
  };
};
