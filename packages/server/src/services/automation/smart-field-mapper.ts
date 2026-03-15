import type { AIResponse } from "@bao/shared";
import {
  AI_DEFAULT_TEMPERATURE_STRUCTURED,
  AI_MAX_TOKENS_FIELD_MAPPER,
  API_ERROR_NETWORK_REQUEST_FAILED,
  AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH,
  AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  safeParseJson,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared";
import { z } from "zod";
import { config } from "../../config/env";
import { formFieldAnalysisPrompt } from "../ai/prompts";

const selectorMapSchema = z.record(
  z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_URL)).min(1).max(SCHEMA_MAX_ITEMS_SMALL),
);
const fieldAnswersSchema = z.record(
  z.string().trim().min(1).max(AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH),
  z.string().trim().max(AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH),
);
const fieldAnalysisSchema = z.object({
  selectorMap: selectorMapSchema.default({}),
  fieldAnswers: fieldAnswersSchema.default({}),
});
const FIELD_CONTEXT_ITEM_LIMIT = 6;
const FIELD_CONTEXT_TEXT_LIMIT = 280;
const FIELD_CONTEXT_SECTION_LIMIT = 4;

const EMPTY_FIELD_ANALYSIS_RESULT = {
  selectorMap: {},
  fieldAnswers: {},
} satisfies SmartFieldAnalysisResult;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (value: unknown, key: string): Record<string, unknown> | null => {
  if (!isRecord(value)) {
    return null;
  }
  const entry = value[key];
  return isRecord(entry) ? entry : null;
};

const getTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const truncateText = (value: string): string =>
  value.length > FIELD_CONTEXT_TEXT_LIMIT
    ? `${value.slice(0, FIELD_CONTEXT_TEXT_LIMIT)}...`
    : value;

const uniqueNonEmptyStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
};

const getResumeHighlights = (resume: Record<string, unknown>): string[] => {
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const highlights: string[] = [];

  for (const entry of experience) {
    if (!(isRecord(entry) && highlights.length < FIELD_CONTEXT_ITEM_LIMIT)) {
      continue;
    }

    const title = getTrimmedString(entry.title);
    const company = getTrimmedString(entry.company);
    const description = truncateText(getTrimmedString(entry.description));
    const achievements = uniqueNonEmptyStrings(entry.achievements).slice(0, 2);
    const parts = [title, company, description, ...achievements].filter((part) => part.length > 0);
    if (parts.length > 0) {
      highlights.push(parts.join(" | "));
    }
  }

  return highlights;
};

const getProjectHighlights = (resume: Record<string, unknown>): string[] => {
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const highlights: string[] = [];

  for (const entry of projects) {
    if (!(isRecord(entry) && highlights.length < FIELD_CONTEXT_SECTION_LIMIT)) {
      continue;
    }

    const title = getTrimmedString(entry.title);
    const description = truncateText(getTrimmedString(entry.description));
    const technologies = uniqueNonEmptyStrings(entry.technologies).slice(0, 3).join(", ");
    const parts = [title, description, technologies].filter((part) => part.length > 0);
    if (parts.length > 0) {
      highlights.push(parts.join(" | "));
    }
  }

  return highlights;
};

const getCandidateContextSummary = (context: SmartFieldAnalysisContext): string => {
  const personalInfo = getRecord(context.resume, "personalInfo");
  const skills = getRecord(context.resume, "skills");
  const coverLetterContent = getRecord(context.coverLetter ?? null, "content");
  const coverLetterSections = [
    getTrimmedString(coverLetterContent?.opening),
    getTrimmedString(coverLetterContent?.body),
    getTrimmedString(coverLetterContent?.closing),
    getTrimmedString(coverLetterContent?.introduction),
    getTrimmedString(coverLetterContent?.main),
    getTrimmedString(coverLetterContent?.conclusion),
  ]
    .filter((entry) => entry.length > 0)
    .slice(0, FIELD_CONTEXT_SECTION_LIMIT)
    .map((entry) => truncateText(entry));

  const candidateProfile = {
    personalInfo: {
      name: getTrimmedString(personalInfo?.name),
      email: getTrimmedString(personalInfo?.email),
      phone: getTrimmedString(personalInfo?.phone),
      location: getTrimmedString(personalInfo?.location),
      website: getTrimmedString(personalInfo?.website),
      linkedIn: getTrimmedString(personalInfo?.linkedIn),
      github: getTrimmedString(personalInfo?.github),
      portfolio: getTrimmedString(personalInfo?.portfolio),
    },
    summary: truncateText(getTrimmedString(context.resume.summary)),
    experienceHighlights: getResumeHighlights(context.resume),
    projectHighlights: getProjectHighlights(context.resume),
    skills: {
      technical: uniqueNonEmptyStrings(skills?.technical).slice(0, FIELD_CONTEXT_ITEM_LIMIT),
      soft: uniqueNonEmptyStrings(skills?.soft).slice(0, FIELD_CONTEXT_ITEM_LIMIT),
      gaming: uniqueNonEmptyStrings(skills?.gaming).slice(0, FIELD_CONTEXT_ITEM_LIMIT),
    },
    coverLetterHighlights: coverLetterSections,
    existingAnswers: context.existingAnswers,
  };

  return JSON.stringify(candidateProfile, null, 2);
};

const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(), delayMs);
    if (
      typeof timer === "object" &&
      timer !== null &&
      "unref" in timer &&
      typeof timer.unref === "function"
    ) {
      timer.unref();
    }
  });

type FetchPageResult =
  | {
      ok: true;
      html: string;
    }
  | {
      ok: false;
      statusCode?: number;
      message: string;
    };

const isRetryableFetchFailure = (result: FetchPageResult): boolean => {
  if (result.ok) {
    return false;
  }
  if (typeof result.statusCode !== "number") {
    return true;
  }
  return result.statusCode === 429 || result.statusCode >= HTTP_STATUS_INTERNAL_SERVER_ERROR;
};

/**
 * Minimal AI client contract required by smart field mapping.
 */
export interface FieldMapperAIClient {
  generate: (
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ) => Promise<AIResponse>;
}

/**
 * Candidate context supplied to AI-assisted form analysis.
 */
export interface SmartFieldAnalysisContext {
  readonly resume: Record<string, unknown>;
  readonly coverLetter?: Record<string, unknown> | null;
  readonly existingAnswers?: Record<string, string>;
}

/**
 * AI-generated selector hints plus inferred answers for non-core form fields.
 */
export interface SmartFieldAnalysisResult {
  readonly selectorMap: Record<string, string[]>;
  readonly fieldAnswers: Record<string, string>;
}

/**
 * AI-powered selector mapper for job-application form fields.
 */
export class SmartFieldMapper {
  /**
   * Analyzes a job page and returns validated selector candidates plus inferred answers.
   */
  async analyze(
    jobUrl: string,
    fieldsNeeded: string[],
    context: SmartFieldAnalysisContext,
    aiService: FieldMapperAIClient,
  ): Promise<SmartFieldAnalysisResult> {
    const uniqueFields = Array.from(
      new Set(fieldsNeeded.map((field) => field.trim()).filter((field) => field.length > 0)),
    );

    if (uniqueFields.length === 0) {
      return EMPTY_FIELD_ANALYSIS_RESULT;
    }

    return this.fetchPageWithRetry({
      url: jobUrl,
      attemptsRemaining: config.smartFieldMapperRetries,
      delayMs: config.smartFieldMapperRetryDelayMs,
    }).then(
      async (pageResult) => {
        if (!pageResult.ok) {
          return EMPTY_FIELD_ANALYSIS_RESULT;
        }

        const stripped = this.stripToFormElements(pageResult.html);
        if (stripped.length < 20) {
          return EMPTY_FIELD_ANALYSIS_RESULT;
        }

        return this.generateFieldAnalysisWithRetry({
          aiService,
          strippedHtml: stripped,
          fieldsNeeded: uniqueFields,
          candidateContext: getCandidateContextSummary(context),
          attemptsRemaining: config.smartFieldMapperRetries,
          delayMs: config.smartFieldMapperRetryDelayMs,
        });
      },
      () => EMPTY_FIELD_ANALYSIS_RESULT,
    );
  }

  /**
   * Fetches page HTML and retries for transient failures.
   */
  private fetchPageWithRetry(params: {
    url: string;
    attemptsRemaining: number;
    delayMs: number;
  }): Promise<FetchPageResult> {
    return this.fetchPage(params.url).then(async (result) => {
      if (!isRetryableFetchFailure(result) || params.attemptsRemaining <= 1) {
        return result;
      }

      await wait(params.delayMs);
      return this.fetchPageWithRetry({
        ...params,
        attemptsRemaining: params.attemptsRemaining - 1,
        delayMs: params.delayMs * 2,
      });
    });
  }

  /**
   * Fetches page HTML with a deterministic timeout and status checks.
   */
  private fetchPage(url: string): Promise<FetchPageResult> {
    return fetch(url, {
      signal: AbortSignal.timeout(config.smartFieldMapperFetchTimeoutMs),
      headers: {
        "User-Agent": config.smartFieldMapperUserAgent,
      },
    }).then(
      async (response) => {
        if (!response.ok) {
          return {
            ok: false,
            statusCode: response.status,
            message: `HTTP ${response.status}`,
          } satisfies FetchPageResult;
        }

        return {
          ok: true,
          html: await response.text(),
        } satisfies FetchPageResult;
      },
      () =>
        ({
          ok: false,
          message: API_ERROR_NETWORK_REQUEST_FAILED,
        }) satisfies FetchPageResult,
    );
  }

  /**
   * Executes AI analysis with bounded retries and exponential backoff.
   */
  private generateFieldAnalysisWithRetry(params: {
    aiService: FieldMapperAIClient;
    strippedHtml: string;
    fieldsNeeded: string[];
    candidateContext: string;
    attemptsRemaining: number;
    delayMs: number;
  }): Promise<SmartFieldAnalysisResult> {
    const prompt = formFieldAnalysisPrompt(
      params.strippedHtml,
      params.fieldsNeeded,
      params.candidateContext,
    );
    return params.aiService
      .generate(prompt, {
        temperature: AI_DEFAULT_TEMPERATURE_STRUCTURED,
        maxTokens: AI_MAX_TOKENS_FIELD_MAPPER,
      })
      .then(
        async (response) => {
          if (response.error || !response.content) {
            if (params.attemptsRemaining > 1) {
              await wait(params.delayMs);
              return this.generateFieldAnalysisWithRetry({
                ...params,
                attemptsRemaining: params.attemptsRemaining - 1,
                delayMs: params.delayMs * 2,
              });
            }
            return EMPTY_FIELD_ANALYSIS_RESULT;
          }

          const parsedAnalysis = this.parseFieldAnalysisResponse(response.content);
          if (
            Object.keys(parsedAnalysis.selectorMap).length > 0 ||
            Object.keys(parsedAnalysis.fieldAnswers).length > 0
          ) {
            return parsedAnalysis;
          }

          if (params.attemptsRemaining > 1) {
            await wait(params.delayMs);
            return this.generateFieldAnalysisWithRetry({
              ...params,
              attemptsRemaining: params.attemptsRemaining - 1,
              delayMs: params.delayMs * 2,
            });
          }

          return EMPTY_FIELD_ANALYSIS_RESULT;
        },
        async () => {
          if (params.attemptsRemaining > 1) {
            await wait(params.delayMs);
            return this.generateFieldAnalysisWithRetry({
              ...params,
              attemptsRemaining: params.attemptsRemaining - 1,
              delayMs: params.delayMs * 2,
            });
          }
          return EMPTY_FIELD_ANALYSIS_RESULT;
        },
      );
  }

  /**
   * Parses and validates selector/answer JSON emitted by the AI provider.
   */
  private parseFieldAnalysisResponse(content: string): SmartFieldAnalysisResult {
    const cleaned = content
      .replace(/```json\n?/gu, "")
      .replace(/```\n?/gu, "")
      .trim();
    const parsedValue = safeParseJson(cleaned);
    const parsedAnalysis = fieldAnalysisSchema.safeParse(parsedValue);
    if (parsedAnalysis.success) {
      return parsedAnalysis.data;
    }

    const parsedSelectors = selectorMapSchema.safeParse(parsedValue);
    if (parsedSelectors.success) {
      return {
        selectorMap: parsedSelectors.data,
        fieldAnswers: {},
      };
    }

    return EMPTY_FIELD_ANALYSIS_RESULT;
  }

  /**
   * Strips an HTML document to form-relevant elements only.
   */
  private stripToFormElements(html: string): string {
    const formElementRegex =
      /<(?:form|input|textarea|select|option|label|button|fieldset|legend)\b[^>]*(?:\/>|>(?:[\s\S]*?)<\/(?:form|input|textarea|select|option|label|button|fieldset|legend)>|>)/giu;

    const matches = html.match(formElementRegex);
    if (!matches) {
      return "";
    }

    let result = "";
    for (const match of matches) {
      if (result.length + match.length > config.smartFieldMapperMaxFormHtmlChars) {
        break;
      }
      result += `${match}\n`;
    }

    return result.trim();
  }
}

export const smartFieldMapper = new SmartFieldMapper();
