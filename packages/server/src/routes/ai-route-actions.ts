import {
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
} from "@bao/shared/constants/ai-generation";
import {
  API_ERROR_ANALYZE_RESUME,
  API_ERROR_GENERATE_AI_RESPONSE,
  API_ERROR_GENERATE_COVER_LETTER,
  API_ERROR_MATCH_JOBS,
  API_ERROR_RESUME_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import {
  API_MESSAGE_COVER_LETTER_GENERATED,
  API_MESSAGE_RESUME_ANALYSIS_COMPLETE,
} from "@bao/shared/constants/api-messages";
import { resolveBrandSettings } from "@bao/shared/constants/branding";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { SCHEMA_MAX_LENGTH_LONG } from "@bao/shared/constants/schema-limits";
import type { AIChatContextDomain, AIResponse } from "@bao/shared/types/ai";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { resumes } from "../db/schema/resumes";
import { contextManager } from "../services/ai/context-manager";
import {
  loadEntityPromptContext,
  serializeEntityPromptContext,
} from "../services/ai/prompt-context-loader";
import { buildSystemPrompt } from "../services/ai/prompts-system";
import {
  type ChatContextPayload,
  composeChatSystemPrompt,
  normalizeClientChatContext,
} from "./ai-route-chat-context";
import {
  buildAnalyzeResumePrompt,
  buildCoverLetterPrompt,
  parseCoverLetterSections,
  parseResumeAnalysisResult,
  resolveAnalyzeResumeJobDescription,
  resolveCoverLetterJobDescription,
  serializeResume,
} from "./ai-route-content";
import type { AnalyzeResumeBody, GenerateCoverLetterBody } from "./ai-route-contracts";
import { runJobMatchingFlow } from "./ai-route-job-matching";
import { getAIService, getAISettingsRow } from "./ai-route-support";

type ChatHistoryInsert = typeof chatHistory.$inferInsert;

const routeResult = <const Status extends number, Body>(status: Status, body: Body) => ({
  status,
  body,
});

const createChatMessage = (
  role: "user" | "assistant",
  content: string,
  sessionId: string,
): ChatHistoryInsert => ({
  id: generateId(),
  role,
  content,
  timestamp: new Date().toISOString(),
  sessionId,
});

const persistChatMessage = async (message: ChatHistoryInsert) =>
  settle(db.insert(chatHistory).values(message));

const buildChatRouteResponse = (
  assistantMessage: ChatHistoryInsert,
  response: AIResponse,
  preferredDomain: AIChatContextDomain,
) => ({
  message: assistantMessage.content,
  sessionId: assistantMessage.sessionId,
  timestamp: assistantMessage.timestamp,
  provider: response.provider,
  model: response.model,
  followUps: contextManager.generateFollowUps(preferredDomain),
  contextDomain: preferredDomain,
});

const loadChatEntityEnrichment = async (
  clientContext: ReturnType<typeof normalizeClientChatContext>,
): Promise<string | undefined> => {
  const entity = clientContext?.entity;
  if (!entity) {
    return undefined;
  }
  const entityContext = await loadEntityPromptContext({
    jobId: entity.type === "job" ? entity.id : undefined,
    studioId: entity.type === "studio" ? entity.id : undefined,
    includeSkills: true,
  });
  return serializeEntityPromptContext(entityContext);
};

export const handleChatRoute = async (body: {
  message: string;
  sessionId?: string;
  context?: ChatContextPayload;
}) => {
  const sessionId = body.sessionId ?? generateId();
  const persistUserMessageResult = await persistChatMessage(
    createChatMessage("user", body.message, sessionId),
  );
  if (persistUserMessageResult.status === "rejected") {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
      error: toErrorMessage(persistUserMessageResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    });
  }

  const clientContext = normalizeClientChatContext(body.context);
  const preferredDomain = clientContext?.domain ?? contextManager.inferDomain(body.message);
  const settingsRow = await getAISettingsRow();
  const runtimeBrand = resolveBrandSettings(settingsRow?.brandSettings);
  const aiService = await getAIService(settingsRow);
  const contextualConversation = await contextManager.buildContext(
    sessionId,
    body.message,
    preferredDomain,
    runtimeBrand,
  );
  const entityEnrichment = await loadChatEntityEnrichment(clientContext);
  const systemPrompt = composeChatSystemPrompt(
    buildSystemPrompt(runtimeBrand),
    contextualConversation.systemPrompt,
    clientContext,
    entityEnrichment,
  );
  const generationResult = await settle(
    aiService.generate(body.message, {
      purpose: "chat",
      systemPrompt,
      messages: contextualConversation.messages,
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (generationResult.status === "rejected") {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
      error: toErrorMessage(generationResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    });
  }

  const response = generationResult.value;
  if (response.error) {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, { error: response.error });
  }

  const assistantMessage = createChatMessage("assistant", response.content, sessionId);
  const persistAssistantMessageResult = await persistChatMessage(assistantMessage);
  if (persistAssistantMessageResult.status === "rejected") {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
      error: toErrorMessage(persistAssistantMessageResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    });
  }

  return routeResult(
    HTTP_STATUS_OK,
    buildChatRouteResponse(assistantMessage, response, preferredDomain),
  );
};

export const handleAnalyzeResumeRoute = async (body: AnalyzeResumeBody) => {
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
  const resume = resumeRows[0];
  if (!resume) {
    return routeResult(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_RESUME_NOT_FOUND });
  }

  const resumeText = serializeResume(resume);
  const [jobDescription, entityContext] = await Promise.all([
    resolveAnalyzeResumeJobDescription(body.jobId),
    loadEntityPromptContext({
      jobId: body.jobId,
      includeSkills: true,
    }),
  ]);
  const enrichedJobDescription = [jobDescription, serializeEntityPromptContext(entityContext)]
    .filter((section) => typeof section === "string" && section.length > 0)
    .join("\n\n");
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(buildAnalyzeResumePrompt(resumeText, enrichedJobDescription), {
      purpose: "resume",
      temperature: AI_DEFAULT_TEMPERATURE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (responseResult.status === "rejected") {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
      error: toErrorMessage(responseResult.reason, API_ERROR_ANALYZE_RESUME),
    });
  }

  const response = responseResult.value;
  if (response.error) {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, { error: response.error });
  }

  return routeResult(HTTP_STATUS_OK, {
    message: API_MESSAGE_RESUME_ANALYSIS_COMPLETE,
    resumeId: body.resumeId,
    jobId: body.jobId || null,
    analysis: parseResumeAnalysisResult(response.content),
    provider: response.provider,
    model: response.model,
  });
};

export const handleGenerateCoverLetterRoute = async (body: GenerateCoverLetterBody) => {
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
  const resume = resumeRows[0];
  if (!resume) {
    return routeResult(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_RESUME_NOT_FOUND });
  }

  const resumeText = serializeResume(resume);
  const [jobDescription, entityContext] = await Promise.all([
    resolveCoverLetterJobDescription(body.jobId),
    loadEntityPromptContext({
      jobId: body.jobId,
      includeSkills: true,
    }),
  ]);
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(
      buildCoverLetterPrompt(
        body.company,
        body.position,
        jobDescription,
        resumeText,
        entityContext,
      ),
      {
        purpose: "coverLetter",
        temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
        maxTokens: SCHEMA_MAX_LENGTH_LONG,
      },
    ),
  );
  if (responseResult.status === "rejected") {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
      error: toErrorMessage(responseResult.reason, API_ERROR_GENERATE_COVER_LETTER),
    });
  }

  const response = responseResult.value;
  if (response.error) {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, { error: response.error });
  }

  return routeResult(HTTP_STATUS_OK, {
    message: API_MESSAGE_COVER_LETTER_GENERATED,
    content: parseCoverLetterSections(response.content),
    provider: response.provider,
    model: response.model,
  });
};

export const handleMatchJobsRoute = async (body: { resumeId?: string; skills?: string[] }) => {
  const flowResult = await settle(runJobMatchingFlow(body.resumeId, body.skills));
  if (flowResult.status === "rejected") {
    return routeResult(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
      error: toErrorMessage(flowResult.reason, API_ERROR_MATCH_JOBS),
    });
  }
  return routeResult(HTTP_STATUS_OK, flowResult.value);
};
