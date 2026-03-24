<script setup lang="ts">
import type { AIProviderType } from "@bao/shared";

type IconPath = {
  readonly d: string;
  readonly fill?: string;
};

const AI_PROVIDER_ICON_PATHS: Record<AIProviderType, readonly IconPath[]> = {
  local: [
    {
      d: "M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v7A2.5 2.5 0 0 1 17.5 17h-11A2.5 2.5 0 0 1 4 14.5v-7Z",
    },
    { d: "M8 20h8" },
    { d: "M10 17v3" },
    { d: "M14 17v3" },
  ],
  gemini: [
    {
      d: "M12 3.5 14.2 9.1 20.5 12 14.2 14.9 12 20.5 9.8 14.9 3.5 12 9.8 9.1 12 3.5Z",
      fill: "currentColor",
    },
  ],
  claude: [
    { d: "M12 4.5a7.5 7.5 0 1 1-5.3 12.8" },
    { d: "M12 4.5a7.5 7.5 0 0 0 5.3 12.8" },
    { d: "M9.2 9.5a1 1 0 1 0 0 .01" },
    { d: "M14.8 9.5a1 1 0 1 0 0 .01" },
    { d: "M9.5 14.2c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2" },
  ],
  openai: [
    {
      d: "M12 3.6c1.5 0 2.9.8 3.7 2.1l1.8-.3a3.8 3.8 0 0 1 4.1 4.8l-1 1.6 1 1.6a3.8 3.8 0 0 1-4.1 4.8l-1.8-.3A4.3 4.3 0 0 1 12 20.4a4.3 4.3 0 0 1-3.7-2.1l-1.8.3a3.8 3.8 0 0 1-4.1-4.8l1-1.6-1-1.6A3.8 3.8 0 0 1 6.5 5.4l1.8.3A4.3 4.3 0 0 1 12 3.6Z",
    },
    { d: "M8.4 7.8 12 6l3.6 1.8v4.4L12 14l-3.6-1.8Z" },
  ],
  huggingface: [
    { d: "M6.5 12.2a2.3 2.3 0 1 1 0-4.6" },
    { d: "M17.5 12.2a2.3 2.3 0 1 0 0-4.6" },
    { d: "M8.4 13.5c1.1 1.7 2.2 2.5 3.6 2.5s2.5-.8 3.6-2.5" },
    { d: "M9.7 9.7a.8.8 0 1 0 0 .01" },
    { d: "M14.3 9.7a.8.8 0 1 0 0 .01" },
    { d: "M7.2 7.4 6 5.7" },
    { d: "M16.8 7.4 18 5.7" },
  ],
};

const props = withDefaults(
  defineProps<{
    providerId: AIProviderType;
    class?: string;
  }>(),
  {
    class: "",
  },
);

const iconPaths = computed(() => AI_PROVIDER_ICON_PATHS[props.providerId]);
const iconClass = computed(() => ["inline-block shrink-0 align-middle", props.class]);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="iconClass"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="iconPath in iconPaths"
      :key="iconPath.d"
      :d="iconPath.d"
      :fill="iconPath.fill ?? 'none'"
    />
  </svg>
</template>
