import {
  AI_CHAT_FLOATING_CONTEXT_DOMAIN_LABEL_KEYS,
  AI_CHAT_FLOATING_CONTEXT_PROMPT_KEYS,
  AI_CHAT_FLOATING_FOCUSED_ENTITY_PROMPT_KEY,
} from "@bao/shared/constants/ai-chat";
import type { AIChatContext, AIChatContextEntityType } from "@bao/shared/types/ai";
import { type ComputedRef, computed } from "vue";

type Translator = (key: string, params?: Record<string, unknown>) => string;

const ENTITY_PROMPT_KEY_BY_TYPE: Record<AIChatContextEntityType, string> = {
  automation_run: "floatingChat.prompts.entity.automationRun",
  interview_session: "floatingChat.prompts.entity.interviewSession",
  job: "floatingChat.prompts.entity.job",
  resume: "floatingChat.prompts.entity.resume",
  studio: "floatingChat.prompts.entity.studio",
};

const ENTITY_TYPE_LABEL_KEY_BY_TYPE: Record<AIChatContextEntityType, string> = {
  automation_run: "floatingChat.entityTypes.automationRun",
  interview_session: "floatingChat.entityTypes.interviewSession",
  job: "floatingChat.entityTypes.job",
  resume: "floatingChat.entityTypes.resume",
  studio: "floatingChat.entityTypes.studio",
};

const SOURCE_LABEL_KEY_BY_TYPE = {
  "chat-page": "floatingChat.sources.chatPage",
  "floating-widget": "floatingChat.sources.floatingWidget",
} as const;

const LEADING_ROUTE_SLASHES_PATTERN = /^\/+/;
const ROUTE_SEGMENT_SEPARATOR_PATTERN = /[-_/]+/g;
const ROUTE_WHITESPACE_PATTERN = /\s+/g;

const humanizeRouteLabel = (routeName: string | undefined, routePath: string): string => {
  const source = routeName && routeName.trim().length > 0 ? routeName : routePath;
  return source
    .replace(LEADING_ROUTE_SLASHES_PATTERN, "")
    .replace(ROUTE_SEGMENT_SEPARATOR_PATTERN, " ")
    .replace(ROUTE_WHITESPACE_PATTERN, " ")
    .trim();
};

const buildStateChips = (context: AIChatContext, t: Translator): string[] => {
  const chips: string[] = [];

  if (context.state.resumeCount > 0) {
    chips.push(t("floatingChat.stateChips.resumes", { count: context.state.resumeCount }));
  }
  if (context.state.jobCount > 0) {
    chips.push(t("floatingChat.stateChips.jobs", { count: context.state.jobCount }));
  }
  if (context.state.studioCount > 0) {
    chips.push(t("floatingChat.stateChips.studios", { count: context.state.studioCount }));
  }
  if (context.state.interviewSessionCount > 0) {
    chips.push(
      t("floatingChat.stateChips.sessions", { count: context.state.interviewSessionCount }),
    );
  }
  if (context.state.portfolioProjectCount > 0) {
    chips.push(
      t("floatingChat.stateChips.projects", { count: context.state.portfolioProjectCount }),
    );
  }

  return chips;
};

const createCurrentContextLabel = (context: ComputedRef<AIChatContext>, t: Translator) =>
  computed(() => {
    const domain = context.value.domain ?? "general";
    return t(AI_CHAT_FLOATING_CONTEXT_DOMAIN_LABEL_KEYS[domain]);
  });

const createFocusedEntityLabel = (context: ComputedRef<AIChatContext>) =>
  computed(() => {
    const entity = context.value.entity;
    if (!entity) {
      return "";
    }

    return entity.label || entity.id;
  });

const createSourceLabel = (context: ComputedRef<AIChatContext>, t: Translator) =>
  computed(() => t(SOURCE_LABEL_KEY_BY_TYPE[context.value.source]));

interface ContextChipBuilderInput {
  context: ComputedRef<AIChatContext>;
  currentContextLabel: ComputedRef<string>;
  focusedEntityLabel: ComputedRef<string>;
  routeLabel: ComputedRef<string>;
  sourceLabel: ComputedRef<string>;
  t: Translator;
}

const createContextChips = ({
  context,
  currentContextLabel,
  focusedEntityLabel,
  routeLabel,
  sourceLabel,
  t,
}: ContextChipBuilderInput) =>
  computed(() => {
    const chips: string[] = [];
    const isFloatingWidget = context.value.source === "floating-widget";

    // Dedicated chat page already renders Context badge in the header — avoid
    // Scope/Surface/Route noise that duplicates page chrome on mobile.
    if (isFloatingWidget) {
      chips.push(
        t("floatingChat.domainChip", {
          context: currentContextLabel.value,
        }),
        t("floatingChat.sourceChip", {
          source: sourceLabel.value,
        }),
      );
      if (routeLabel.value.length > 0) {
        chips.push(t("floatingChat.routeBadge", { route: routeLabel.value }));
      }
    }

    const entity = context.value.entity;
    if (entity) {
      chips.push(
        t("floatingChat.entityChip", {
          type: t(ENTITY_TYPE_LABEL_KEY_BY_TYPE[entity.type]),
          entity: focusedEntityLabel.value,
        }),
      );
    }

    chips.push(...buildStateChips(context.value, t));
    return chips;
  });

const createContextualPrompts = (
  context: ComputedRef<AIChatContext>,
  t: Translator,
  currentContextLabel: ComputedRef<string>,
  focusedEntityLabel: ComputedRef<string>,
) =>
  computed(() => {
    const prompts: string[] = [];
    const entity = context.value.entity;
    const target = focusedEntityLabel.value || currentContextLabel.value;
    const domain = context.value.domain ?? "general";

    const pushPrompt = (key: string) => {
      prompts.push(t(key, { target }));
    };

    if (entity) {
      pushPrompt(AI_CHAT_FLOATING_FOCUSED_ENTITY_PROMPT_KEY);
      pushPrompt(ENTITY_PROMPT_KEY_BY_TYPE[entity.type]);
    }

    pushPrompt(AI_CHAT_FLOATING_CONTEXT_PROMPT_KEYS[domain]);
    pushPrompt(AI_CHAT_FLOATING_CONTEXT_PROMPT_KEYS.general);

    return [...new Set(prompts)];
  });

/**
 * Builds human-readable context labels, chips, and prompt suggestions for AI chat surfaces.
 *
 * @param context - Current typed AI chat context snapshot.
 * @param t - i18n translator used to render localized labels.
 * @returns Computed labels and chips shared by chat page and floating widget.
 */
export function useAIChatContextSummary(context: ComputedRef<AIChatContext>, t: Translator) {
  const currentContextLabel = createCurrentContextLabel(context, t);
  const focusedEntityLabel = createFocusedEntityLabel(context);
  const routeLabel = computed(() =>
    humanizeRouteLabel(context.value.route.name, context.value.route.path),
  );
  const sourceLabel = createSourceLabel(context, t);
  const contextChips = createContextChips({
    context,
    currentContextLabel,
    focusedEntityLabel,
    routeLabel,
    sourceLabel,
    t,
  });
  const contextualPrompts = createContextualPrompts(
    context,
    t,
    currentContextLabel,
    focusedEntityLabel,
  );

  return {
    contextChips,
    contextualPrompts,
    currentContextLabel,
    focusedEntityLabel,
  };
}
