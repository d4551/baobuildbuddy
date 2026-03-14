import type { AIResponse } from "@bao/shared";
import {
  AI_DEFAULT_TEMPERATURE_STRUCTURED,
  AI_MAX_TOKENS_FIELD_MAPPER,
  API_ERROR_NETWORK_REQUEST_FAILED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  safeParseJson,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared";
import { z } from "zod";
import { config } from "../../config/env";
import { formFieldAnalysisPrompt } from "../ai/prompts";

const selectorMapSchema = z.record(
  z.string().trim().min(1).max(120),
  z.array(z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_URL)).min(1).max(SCHEMA_MAX_ITEMS_SMALL),
);

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
 * AI-powered selector mapper for job-application form fields.
 */
export class SmartFieldMapper {
  /**
   * Analyzes a job page and returns validated selector candidates for requested fields.
   */
  async analyze(
    jobUrl: string,
    fieldsNeeded: string[],
    aiService: FieldMapperAIClient,
  ): Promise<Record<string, string[]>> {
    const uniqueFields = Array.from(
      new Set(fieldsNeeded.map((field) => field.trim()).filter((field) => field.length > 0)),
    );

    if (uniqueFields.length === 0) {
      return {};
    }

    return this.fetchPageWithRetry({
      url: jobUrl,
      attemptsRemaining: config.smartFieldMapperRetries,
      delayMs: config.smartFieldMapperRetryDelayMs,
    }).then(
      async (pageResult) => {
        if (!pageResult.ok) {
          return {};
        }

        const stripped = this.stripToFormElements(pageResult.html);
        if (stripped.length < 20) {
          return {};
        }

        return this.generateSelectorMapWithRetry({
          aiService,
          strippedHtml: stripped,
          fieldsNeeded: uniqueFields,
          attemptsRemaining: config.smartFieldMapperRetries,
          delayMs: config.smartFieldMapperRetryDelayMs,
        });
      },
      () => ({}),
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
  private generateSelectorMapWithRetry(params: {
    aiService: FieldMapperAIClient;
    strippedHtml: string;
    fieldsNeeded: string[];
    attemptsRemaining: number;
    delayMs: number;
  }): Promise<Record<string, string[]>> {
    const prompt = formFieldAnalysisPrompt(params.strippedHtml, params.fieldsNeeded);
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
              return this.generateSelectorMapWithRetry({
                ...params,
                attemptsRemaining: params.attemptsRemaining - 1,
                delayMs: params.delayMs * 2,
              });
            }
            return {};
          }

          const parsedMap = this.parseSelectorResponse(response.content);
          if (Object.keys(parsedMap).length > 0) {
            return parsedMap;
          }

          if (params.attemptsRemaining > 1) {
            await wait(params.delayMs);
            return this.generateSelectorMapWithRetry({
              ...params,
              attemptsRemaining: params.attemptsRemaining - 1,
              delayMs: params.delayMs * 2,
            });
          }

          return {};
        },
        async () => {
          if (params.attemptsRemaining > 1) {
            await wait(params.delayMs);
            return this.generateSelectorMapWithRetry({
              ...params,
              attemptsRemaining: params.attemptsRemaining - 1,
              delayMs: params.delayMs * 2,
            });
          }
          return {};
        },
      );
  }

  /**
   * Parses and validates selector-map JSON emitted by the AI provider.
   */
  private parseSelectorResponse(content: string): Record<string, string[]> {
    const cleaned = content
      .replace(/```json\n?/gu, "")
      .replace(/```\n?/gu, "")
      .trim();
    const parsedValue = safeParseJson(cleaned);
    const parsedSelectors = selectorMapSchema.safeParse(parsedValue);
    if (!parsedSelectors.success) {
      return {};
    }
    return parsedSelectors.data;
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
