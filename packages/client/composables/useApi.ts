/**
 * Typed access boundary for the Eden Treaty `$api` instance.
 * All composables use this to access the Elysia server.
 */
import type { NuxtApp } from "#app";
import { useNuxtRuntimeApp } from "./nuxtRuntime";

/**
 * Returns the typed Eden API client exposed by the Nuxt plugin.
 *
 * @returns The Nuxt runtime `$api` instance.
 */
export function useApi(): NuxtApp["$api"] {
  const { $api } = useNuxtRuntimeApp();
  return $api;
}
