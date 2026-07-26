import { inferAIChatDomainFromRoutePath } from "@bao/shared/constants/ai-chat";
import {
  SCHEMA_MAX_LENGTH_DEVICE,
  SCHEMA_MAX_LENGTH_ENTITY_TYPE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_SOURCE,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import {
  AI_CHAT_CONTEXT_DOMAIN_IDS,
  AI_CHAT_CONTEXT_ENTITY_TYPE_IDS,
  AI_CHAT_CONTEXT_SOURCE_IDS,
  type AIChatContext,
} from "@bao/shared/types/ai";
import { t } from "elysia";
import type { Static } from "typebox";

export const chatContextSchema = t.Object(
  {
    source: t.String({ maxLength: SCHEMA_MAX_LENGTH_SOURCE }),
    domain: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SOURCE })),
    route: t.Object(
      {
        path: t.String({ maxLength: SCHEMA_MAX_LENGTH_URL }),
        name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
        params: t.Record(t.String(), t.String()),
        query: t.Record(t.String(), t.String()),
      },
      { required: ["path", "params", "query"] },
    ),
    entity: t.Optional(
      t.Object(
        {
          type: t.String({ maxLength: SCHEMA_MAX_LENGTH_ENTITY_TYPE }),
          id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
          label: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        },
        { required: ["type", "id"] },
      ),
    ),
    state: t.Object(
      {
        hasResumes: t.Boolean(),
        resumeCount: t.Number(),
        hasJobs: t.Boolean(),
        jobCount: t.Number(),
        hasStudios: t.Boolean(),
        studioCount: t.Number(),
        hasInterviewSessions: t.Boolean(),
        interviewSessionCount: t.Number(),
        hasPortfolioProjects: t.Boolean(),
        portfolioProjectCount: t.Number(),
      },
      {
        required: [
          "hasResumes",
          "resumeCount",
          "hasJobs",
          "jobCount",
          "hasStudios",
          "studioCount",
          "hasInterviewSessions",
          "interviewSessionCount",
          "hasPortfolioProjects",
          "portfolioProjectCount",
        ],
      },
    ),
  },
  { required: ["source", "route", "state"] },
);

export const aiPreferenceSchema = t.Record(
  t.String(),
  t.Union([t.String(), t.Number(), t.Boolean()]),
);

export type ChatContextPayload = Static<typeof chatContextSchema>;

const isValidChatContextSource = (value: string): value is AIChatContext["source"] =>
  AI_CHAT_CONTEXT_SOURCE_IDS.some((entry) => entry === value);

const isValidChatContextDomain = (value: string): value is NonNullable<AIChatContext["domain"]> =>
  AI_CHAT_CONTEXT_DOMAIN_IDS.some((entry) => entry === value);

const isValidChatContextEntityType = (
  value: string,
): value is NonNullable<AIChatContext["entity"]>["type"] =>
  AI_CHAT_CONTEXT_ENTITY_TYPE_IDS.some((entry) => entry === value);

const normalizeRouteName = (name: string | undefined): string | undefined =>
  typeof name === "string" && name.trim().length > 0 ? name : undefined;

const normalizeChatContextEntity = (
  entity: ChatContextPayload["entity"],
): AIChatContext["entity"] | undefined => {
  if (!(entity && isValidChatContextEntityType(entity.type))) {
    return;
  }

  const normalizedLabel =
    typeof entity.label === "string" && entity.label.trim().length > 0 ? entity.label : undefined;

  return {
    type: entity.type,
    id: entity.id,
    ...(normalizedLabel ? { label: normalizedLabel } : {}),
  };
};

export function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null {
  if (!(context && isValidChatContextSource(context.source))) {
    return null;
  }

  const route = context.route;
  const state = context.state;
  if (!(route && state)) {
    return null;
  }

  const fallbackDomain = inferAIChatDomainFromRoutePath(route.path);
  const domain =
    typeof context.domain === "string" && isValidChatContextDomain(context.domain)
      ? context.domain
      : fallbackDomain;
  const routeName = normalizeRouteName(route.name);

  const normalizedContext: AIChatContext = {
    source: context.source,
    domain,
    route: {
      path: route.path,
      ...(routeName ? { name: routeName } : {}),
      params: route.params ?? {},
      query: route.query ?? {},
    },
    state,
  };

  const normalizedEntity = normalizeChatContextEntity(context.entity);
  if (normalizedEntity) {
    normalizedContext.entity = normalizedEntity;
  }

  return normalizedContext;
}

export function serializeClientChatContext(context: AIChatContext): string {
  const lines: string[] = [
    `Client Source: ${context.source}`,
    `Route Path: ${context.route.path}`,
    `Route Domain: ${context.domain ?? inferAIChatDomainFromRoutePath(context.route.path)}`,
    `State Snapshot: hasResumes=${context.state.hasResumes}, resumeCount=${context.state.resumeCount}, hasJobs=${context.state.hasJobs}, jobCount=${context.state.jobCount}, hasStudios=${context.state.hasStudios}, studioCount=${context.state.studioCount}, hasInterviewSessions=${context.state.hasInterviewSessions}, interviewSessionCount=${context.state.interviewSessionCount}, hasPortfolioProjects=${context.state.hasPortfolioProjects}, portfolioProjectCount=${context.state.portfolioProjectCount}`,
  ];

  if (context.route.name) {
    lines.push(`Route Name: ${context.route.name}`);
  }

  if (Object.keys(context.route.params).length > 0) {
    lines.push(`Route Params: ${JSON.stringify(context.route.params)}`);
  }

  if (Object.keys(context.route.query).length > 0) {
    lines.push(`Route Query: ${JSON.stringify(context.route.query)}`);
  }

  if (context.entity) {
    const baseEntityLine = `Focused Entity: ${context.entity.type} (${context.entity.id})`;
    lines.push(
      context.entity.label ? `${baseEntityLine} - ${context.entity.label}` : baseEntityLine,
    );
  }

  return lines.join("\n");
}

export function composeChatSystemPrompt(
  basePrompt: string,
  contextualPrompt: string,
  clientContext: AIChatContext | null,
  entityEnrichment?: string,
): string {
  const promptSections = [basePrompt, contextualPrompt];
  if (clientContext) {
    promptSections.push(`Client UI Context:\n${serializeClientChatContext(clientContext)}`);
  }
  if (entityEnrichment) {
    promptSections.push(`Focused Entity Context:\n${entityEnrichment}`);
  }
  return promptSections.join("\n\n");
}
