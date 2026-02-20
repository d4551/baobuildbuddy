import { useNuxtApp as useNuxtAppInternal, useState as useStateInternal } from "nuxt/app";

/**
 * Internal Nuxt runtime boundary for composable consumers.
 */
export { useNuxtAppInternal as useNuxtRuntimeApp, useStateInternal as useNuxtState };
