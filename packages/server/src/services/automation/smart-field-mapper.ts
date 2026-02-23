import { safeParseJson } from "@bao/shared";
import type { AIResponse } from "@bao/shared";
import * as z from "zod";
import { config } from "../../config/env";
import { formFieldAnalysisPrompt } from "../ai/prompts";

const MAX_STRIPPED_FORM_HTML_CHARS = 4_000;
const FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const selectorMapSchema = z.record(
  z.string().trim().min(1).max(120),
  z.array(z.string().trim().min(1).max(500)).min(1).max(20),
);

const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(), delayMs);
    if (typeof timer === "object" && timer !== null && "unref" in timer) {
      const maybeUnref = timer.unref;
      if (typeof maybeUnref === "function") {
        maybeUnref.call(timer);
      }
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
      new Set(
        fieldsNeeded
          .map((field) => field.trim())
          .filter((field) => field.length > 0),
      ),
    );

    if (uniqueFields.length === 0) {
      return {};
    }

    return this.fetchPage(jobUrl).then(
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
   * Fetches page HTML with a deterministic timeout and status checks.
   */
  private fetchPage(url: string): Promise<FetchPageResult> {
    return fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": DEFAULT_BROWSER_USER_AGENT,
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
          message: "Network request failed",
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
        temperature: 0.1,
        maxTokens: 1000,
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
    const cleaned = content.replace(/```json\n?/gu, "").replace(/```\n?/gu, "").trim();
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
      if (result.length + match.length > MAX_STRIPPED_FORM_HTML_CHARS) {
        break;
      }
      result += `${match}\n`;
    }

    return result.trim();
  }
}

export const smartFieldMapper = new SmartFieldMapper();
