export const CHAT_DENSITY_OPTIONS = ["comfortable", "compact"] as const;

export type ChatDensity = (typeof CHAT_DENSITY_OPTIONS)[number];

/**
 * Shared width constraints for chat message headers and bubbles.
 */
export const CHAT_MESSAGE_WIDTH_CLASS_BY_DENSITY = {
  comfortable: "w-fit min-w-44 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
  compact: "w-fit min-w-40 max-w-full sm:max-w-md",
} as const satisfies Record<ChatDensity, string>;

/**
 * Shared typography/spacing scale for chat message bubbles.
 */
export const CHAT_BUBBLE_SIZE_CLASS_BY_DENSITY = {
  comfortable: "min-h-12 px-4 py-3 text-sm leading-relaxed sm:text-base",
  compact: "min-h-10 px-3 py-2.5 text-sm leading-6",
} as const satisfies Record<ChatDensity, string>;

export const CHAT_AVATAR_SIZE_CLASS_BY_DENSITY = {
  comfortable: "w-10",
  compact: "w-9",
} as const satisfies Record<ChatDensity, string>;

/**
 * Floating chat panel responsive dimensions.
 */
export const FLOATING_CHAT_PANEL_SIZE_CLASS =
  "w-full max-w-md sm:max-w-lg md:max-w-xl h-96 max-h-screen";

/**
 * Full-page chat viewport container dimensions.
 */
export const CHAT_PAGE_CONTAINER_CLASS = "flex w-full min-h-96 flex-col";
