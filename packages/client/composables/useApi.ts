/**
 * Typed wrapper around the Eden Treaty $api instance.
 * All composables use this to access the Elysia server.
 */
export function useApi() {
  const { $api } = useNuxtApp();
  return $api;
}
