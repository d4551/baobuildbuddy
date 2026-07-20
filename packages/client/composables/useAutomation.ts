import { useRuntimeConfig } from "#imports";
import {
  createAutomationEdenMutations,
  createAutomationEdenQueries,
} from "~/composables/automation-eden-actions";
import { createAutomationRunSubscription } from "~/composables/automation-run-subscription";
import { useClientApiRequestRuntime } from "~/composables/api-request";
import { useApi } from "~/composables/useApi";

/**
 * Automation feature composable — Eden Treaty for HTTP; WS for live run events.
 */
export function useAutomation() {
  const api = useApi();
  const config = useRuntimeConfig();
  const runtime = useClientApiRequestRuntime();
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");

  return {
    ...createAutomationEdenMutations(api),
    ...createAutomationEdenQueries(api),
    subscribeToRun: createAutomationRunSubscription(runtime, wsBase),
  };
}
