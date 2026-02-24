import type { AIResponse, GenerateOptions } from "@bao/shared";
import { HfInference } from "@huggingface/inference";
import { BaseAIProvider } from "./provider-interface";

const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};
const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

/**
 * Hugging Face AI Provider
 * Works with free tier (no API key required) or with API token for better rate limits
 */
export class HuggingFaceProvider extends BaseAIProvider {
  name = "huggingface" as const;
  model: string;
  private client: HfInference;

  constructor(apiKey?: string, model = "mistralai/Mistral-7B-Instruct-v0.3") {
    super(apiKey);
    this.model = model;
    this.client = new HfInference(apiKey);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const startTime = Date.now();
    // Build the prompt with system prompt if provided
    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const responseResult = await settlePromise(
      this.client.textGeneration({
        model: this.model,
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.topP ?? 0.95,
          top_k: options?.topK ?? 50,
          return_full_text: false,
        },
      }),
    );
    if (responseResult.status === "rejected") {
      return {
        id: this.generateId(),
        provider: this.name,
        model: this.model,
        content: "",
        error: toErrorMessage(responseResult.reason),
        timing: this.createTimingMetrics(startTime),
      };
    }

    return {
      id: this.generateId(),
      provider: this.name,
      model: this.model,
      content: responseResult.value.generated_text,
      timing: this.createTimingMetrics(startTime),
    };
  }

  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    // Build the prompt with system prompt if provided
    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const stream = this.client.textGenerationStream({
      model: this.model,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.95,
        top_k: options?.topK ?? 50,
        return_full_text: false,
      },
    });

    const iterator = stream[Symbol.asyncIterator]();
    const emitTokens = async function* (): AsyncGenerator<string> {
      const nextChunkResult = await settlePromise(iterator.next());
      if (nextChunkResult.status === "rejected") {
        throw new Error(`HuggingFace streaming error: ${toErrorMessage(nextChunkResult.reason)}`);
      }
      const nextChunk = nextChunkResult.value;
      if (nextChunk.done) {
        return;
      }
      if (nextChunk.value.token.text) {
        yield nextChunk.value.token.text;
      }
      yield* emitTokens();
    };

    yield* emitTokens();
  }

  isAvailable(): Promise<boolean> {
    // HuggingFace free tier is always available
    // Even without an API key, you can use the inference API with rate limits
    return Promise.resolve(true);
  }
}
