import type { AIProviderType, AIResponse } from "@bao/shared";
import type { AIProvider } from "./provider-interface";
import { buildDeterministicContent } from "./ai-deterministic-provider-content";

export const TEST_AI_PROVIDER_NAME: AIProviderType = "local";
export const TEST_AI_MODEL_NAME = "deterministic-test-model";

export class DeterministicTestProvider implements AIProvider {
  name: AIProviderType = TEST_AI_PROVIDER_NAME;
  model = TEST_AI_MODEL_NAME;

  generate(prompt: string): Promise<AIResponse> {
    const startedAt = Date.now();
    const content = buildDeterministicContent(prompt);
    const completedAt = Date.now();
    return Promise.resolve({
      id: `test-${startedAt}`,
      provider: this.name,
      model: this.model,
      content,
      timing: {
        startedAt,
        completedAt,
        totalTime: completedAt - startedAt,
      },
    });
  }

  stream(prompt: string): AsyncGenerator<string> {
    const content = buildDeterministicContent(prompt);
    return (async function* streamDeterministicContent(): AsyncGenerator<string> {
      await Promise.resolve();
      yield content;
    })();
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
