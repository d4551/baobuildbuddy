import type { AIChatContext } from "@bao/shared";
import {
  AI_CHAT_CONTEXT_DOMAIN_IDS,
  AI_CHAT_CONTEXT_ENTITY_TYPE_IDS,
  AI_CHAT_CONTEXT_SOURCE_IDS,
  inferAIChatDomainFromRoutePath,
  SCHEMA_MAX_LENGTH_DEVICE,
  SCHEMA_MAX_LENGTH_ENTITY_TYPE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_SOURCE,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared";
import { t } from "elysia";

export const chatContextSchema = t.Object({
  source: t.String({ maxLength: SCHEMA_MAX_LENGTH_SOURCE }),
  domain: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SOURCE })),
  route: t.Object({
    path: t.String({ maxLength: SCHEMA_MAX_LENGTH_URL }),
    name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
    params: t.Record(t.String(), t.String()),
    query: t.Record(t.String(), t.String()),
  }),
  entity: t.Optional(
    t.Object({
      type: t.String({ maxLength: SCHEMA_MAX_LENGTH_ENTITY_TYPE }),
      id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      label: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    }),
  ),
  state: t.Object({
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
  }),
});

export const aiPreferenceSchema = t.Record(
  t.String(),
  t.Union([t.String(), t.Number(), t.Boolean()]),
);

export type ChatContextPayload = typeof chatContextSchema.static;

const isValidChatContextSource = (value: string): value is AIChatContext["source"] =>
  AI_CHAT_CONTEXT_SOURCE_IDS.some((entry) => entry === value);

const isValidChatContextDomain = (value: string): value is NonNullable<AIChatContext["domain"]> =>
  AI_CHAT_CONTEXT_DOMAIN_IDS.some((entry) => entry === value);

const isValidChatContextEntityType = (
  value: string,
): value is NonNullable<AIChatContext["entity"]>["type"] =>
  AI_CHAT_CONTEXT_ENTITY_TYPE_IDS.some((entry) => entry === value);

export function normalizeClientChatContext(context?: ChatContextPayload): AIChatContext | null {
  if (!(context && isValidChatContextSource(context.source))) {
    return null;
  }

  const fallbackDomain = inferAIChatDomainFromRoutePath(context.route.path);
  const domain =
    typeof context.domain === "string" && isValidChatContextDomain(context.domain)
      ? context.domain
      : fallbackDomain;

  const routeName =
    typeof context.route.name === "string" && context.route.name.trim().length > 0
      ? context.route.name
      : undefined;

  const normalizedContext: AIChatContext = {
    source: context.source,
    domain,
    route: {
      path: context.route.path,
      ...(routeName ? { name: routeName } : {}),
      params: context.route.params,
      query: context.route.query,
    },
    state: context.state,
  };

  if (context.entity && isValidChatContextEntityType(context.entity.type)) {
    const normalizedLabel =
      typeof context.entity.label === "string" && context.entity.label.trim().length > 0
        ? context.entity.label
        : undefined;

    normalizedContext.entity = {
      type: context.entity.type,
      id: context.entity.id,
      ...(normalizedLabel ? { label: normalizedLabel } : {}),
    };
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
): string {
  const promptSections = [basePrompt, contextualPrompt];
  if (clientContext) {
    promptSections.push(`Client UI Context:\n${serializeClientChatContext(clientContext)}`);
  }
  return promptSections.join("\n\n");
}
