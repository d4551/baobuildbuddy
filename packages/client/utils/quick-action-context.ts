import { AI_CHAT_ROUTE_QUERY_KEYS } from "@bao/shared/constants/ai-chat";
import { APP_ROUTES } from "@bao/shared/constants/routes";

/**
 * The floating quick actions used to navigate to fixed paths, which dropped
 * whatever the user was looking at. Opening AI Chat from a studio profile landed
 * on a chat with no studio, and "Customize Resume" from a job posting lost the
 * job — so the AI had no page context to tailor against.
 *
 * These helpers read the entity out of the current route and carry it into the
 * target as route query, using the same query keys the AI chat context builder
 * already reads (`AI_CHAT_ROUTE_QUERY_KEYS`). Pure functions so the mapping is
 * unit-testable without mounting the shell.
 */

export interface QuickActionRouteTarget {
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;
}

/** The entity a page is "about", derived from its route. */
export interface QuickActionSourceEntity {
  readonly studioId: string | null;
  readonly jobId: string | null;
  readonly resumeId: string | null;
}

const trimmedOrNull = (value: string | undefined): string | null => {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** Matches a studio detail path only — not the studio index or analytics routes. */
const resolveStudioIdFromPath = (path: string): string | null => {
  if (!path.startsWith(`${APP_ROUTES.studios}/`)) {
    return null;
  }
  const segment = path.slice(`${APP_ROUTES.studios}/`.length).split("/")[0];
  const studioId = trimmedOrNull(segment);
  if (studioId === null || `${APP_ROUTES.studios}/${studioId}` === APP_ROUTES.studiosAnalytics) {
    return null;
  }
  return studioId;
};

const resolveJobIdFromPath = (path: string): string | null => {
  if (!path.startsWith(`${APP_ROUTES.jobs}/`)) {
    return null;
  }
  return trimmedOrNull(path.slice(`${APP_ROUTES.jobs}/`.length).split("/")[0]);
};

export const resolveQuickActionSourceEntity = (
  path: string,
  query: Readonly<Record<string, string>>,
): QuickActionSourceEntity => ({
  studioId:
    resolveStudioIdFromPath(path) ?? trimmedOrNull(query[AI_CHAT_ROUTE_QUERY_KEYS.studioId]),
  jobId: resolveJobIdFromPath(path) ?? trimmedOrNull(query[AI_CHAT_ROUTE_QUERY_KEYS.jobId]),
  resumeId: trimmedOrNull(query[AI_CHAT_ROUTE_QUERY_KEYS.resumeId]),
});

/**
 * Which entities each destination can act on.
 *
 * This map lists ONLY destinations that actually read these keys off the route
 * today: the AI chat context builder (`ai-context.ts`), the interview hub
 * bootstrap (`interview-hub-bootstrap.ts`), and the studio index
 * (`useStudiosIndexPage.ts`). Forwarding to a page that ignores the query would
 * produce a URL that advertises context the page silently drops — worse than not
 * forwarding, because it looks wired. Add a destination here only together with
 * the code that consumes it.
 */
const FORWARDED_ENTITY_KEYS_BY_PATH: Readonly<
  Record<string, readonly (keyof QuickActionSourceEntity)[]>
> = {
  [APP_ROUTES.aiChat]: ["studioId", "jobId", "resumeId"],
  [APP_ROUTES.interview]: ["studioId", "jobId"],
  [APP_ROUTES.studios]: ["studioId"],
  // `cover-letter-list-page-actions.ts:buildGeneratePayload` reads both keys and
  // sends them to the generation route, which loads the records for the prompt.
  [APP_ROUTES.coverLetter]: ["studioId", "jobId"],
};

const QUERY_KEY_BY_ENTITY: Readonly<Record<keyof QuickActionSourceEntity, string>> = {
  studioId: AI_CHAT_ROUTE_QUERY_KEYS.studioId,
  jobId: AI_CHAT_ROUTE_QUERY_KEYS.jobId,
  resumeId: AI_CHAT_ROUTE_QUERY_KEYS.resumeId,
};

/**
 * Builds the destination for a quick action, carrying the current page's entity
 * when the destination can use it. Navigating to the page you are already on
 * yields no query so the action stays idempotent.
 */
export const resolveQuickActionTarget = (
  actionPath: string,
  currentPath: string,
  currentQuery: Readonly<Record<string, string>>,
): QuickActionRouteTarget => {
  const forwardedKeys = FORWARDED_ENTITY_KEYS_BY_PATH[actionPath];
  if (!forwardedKeys || actionPath === currentPath) {
    return { path: actionPath, query: {} };
  }

  const entity = resolveQuickActionSourceEntity(currentPath, currentQuery);
  const query: Record<string, string> = {};
  for (const entityKey of forwardedKeys) {
    const entityId = entity[entityKey];
    if (entityId !== null) {
      query[QUERY_KEY_BY_ENTITY[entityKey]] = entityId;
    }
  }
  return { path: actionPath, query };
};
