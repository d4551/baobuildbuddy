import { expect, spyOn, test } from "bun:test";
import { HUGGING_FACE_DEFAULT_MODEL } from "@bao/shared/constants/ai-provider";
import type { AIProviderConfig, AIRouting } from "@bao/shared/types/ai";
import { AIService } from "./ai-service";
import { LocalProvider } from "./local-provider";

const createFallbackConfigs = (): AIProviderConfig[] => [
  {
    provider: "local",
    enabled: true,
    baseUrl: "http://localhost:11434/v1",
    model: "local-model",
  },
  {
    provider: "huggingface",
    enabled: true,
    apiKey: "hf_test_token",
    model: HUGGING_FACE_DEFAULT_MODEL,
  },
];

const createFallbackRouting = (): AIRouting => ({
  chat: { provider: "local", model: "auto-router" },
  interviewQuestions: { provider: "local" },
  interviewFeedback: { provider: "local" },
  resume: { provider: "local" },
  coverLetter: { provider: "local" },
  emailResponse: { provider: "local" },
  jobMatch: { provider: "local" },
  scrapeEnrichment: { provider: "local" },
  automationFieldMapping: { provider: "local" },
});

test("generate falls back to the first healthy provider with a concrete provider model", async () => {
  const service = new AIService(createFallbackConfigs(), "local", createFallbackRouting());

  const localProvider = service.getProvider("local");
  const huggingfaceProvider = service.getProvider("huggingface");

  expect(localProvider).toBeTruthy();
  expect(huggingfaceProvider).toBeTruthy();

  if (!(localProvider && huggingfaceProvider)) {
    return;
  }

  spyOn(LocalProvider, "inspectEndpoint").mockResolvedValue({
    provider: "local",
    checkedAt: "2026-03-31T00:00:00.000Z",
    code: "unreachable",
    message: "Endpoint did not respond",
    endpoint: "http://localhost:11434/v1",
  });
  spyOn(huggingfaceProvider, "isAvailable").mockResolvedValue(true);

  let receivedProvider: string | undefined;
  let receivedModel: string | undefined;
  const generateSpy = spyOn(huggingfaceProvider, "generate");
  generateSpy.mockImplementation((_prompt, options) => {
    receivedProvider = options?.provider;
    receivedModel = options?.model;
    return Promise.resolve({
      id: "test-response",
      provider: "huggingface",
      model: options?.model ?? "",
      content: "ok",
    });
  });

  const response = await service.generate("hello", {
    provider: "local",
    model: "auto-router",
  });

  expect(generateSpy).toHaveBeenCalledTimes(1);
  expect(response.provider).toBe("huggingface");
  expect(response.model).toBe(HUGGING_FACE_DEFAULT_MODEL);
  expect(receivedProvider).toBe("huggingface");
  expect(receivedModel).toBe(HUGGING_FACE_DEFAULT_MODEL);
});
