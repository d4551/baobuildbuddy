import { safeParseJson } from "@bao/shared";
import type { AIService } from "../ai/ai-service";
import { formFieldAnalysisPrompt } from "../ai/prompts";

/**
 * AI-powered form field analyzer that maps job application form fields
 * to optimal CSS selectors. Falls back gracefully when AI is unavailable.
 */
export class SmartFieldMapper {
  /**
   * Fetch a job page, strip it to form-relevant elements, and use AI to
   * map field names to CSS selectors.
   *
   * @returns A mapping of field names to prioritized selector arrays,
   *          or an empty object if analysis fails (hardcoded selectors still work).
   */
  async analyze(
    jobUrl: string,
    fieldsNeeded: string[],
    aiService: AIService,
  ): Promise<Record<string, string[]>> {
    return this.fetchPage(jobUrl)
      .then(async (html) => {
        const stripped = this.stripToFormElements(html);

        if (!stripped || stripped.length < 20) {
          return {}; // Page has no recognizable form elements
        }

        const prompt = formFieldAnalysisPrompt(stripped, fieldsNeeded);
        const response = await aiService.generate(prompt, {
          temperature: 0.1,
          maxTokens: 1000,
        });

        if (response.error || !response.content) {
          return {};
        }

        // Parse the AI response — strip markdown code fences if present
        const cleaned = response.content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsedValue = safeParseJson(cleaned);
        if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
          return {};
        }
        const parsed = parsedValue as Record<string, unknown>;

        // Validate and normalize the result
        const result: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
            result[key] = value;
          }
        }

        return result;
      })
      .catch(() => ({}));
  }

  /**
   * Fetch page HTML with a short timeout.
   */
  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    return await res.text();
  }

  /**
   * Strip an HTML document down to only form-relevant elements:
   * <form>, <input>, <textarea>, <select>, <label>, <button>.
   *
   * Truncates to ~4000 chars to keep AI prompt costs low.
   */
  private stripToFormElements(html: string): string {
    const formElementRegex =
      /<(?:form|input|textarea|select|option|label|button|fieldset|legend)\b[^>]*(?:\/>|>(?:[\s\S]*?)<\/(?:form|input|textarea|select|option|label|button|fieldset|legend)>|>)/gi;

    const matches = html.match(formElementRegex);
    if (!matches) return "";

    // Join matches and truncate
    const MAX_CHARS = 4000;
    let result = "";
    for (const match of matches) {
      if (result.length + match.length > MAX_CHARS) break;
      result += `${match}\n`;
    }

    return result.trim();
  }
}

export const smartFieldMapper = new SmartFieldMapper();
