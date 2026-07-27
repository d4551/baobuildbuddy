<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  BADGE_GHOST_CLASS,
  BADGE_SOFT_INFO_CLASS,
  BADGE_SOFT_PRIMARY_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { CHAT_PANEL_PADDING_SM_PX6_CLASS } from "~/constants/ui-layout";

defineProps<{
  brandName: string;
  currentContextLabel: string;
  focusedEntityLabel: string;
  contextChips: string[];
}>();

const emit = defineEmits<{
  clear: [];
}>();

const { t } = useI18n();
</script>

<template>
  <header
    class="border-b border-base-300"
    :class="[PADDING_TOKEN_CLASS.px5, PADDING_TOKEN_CLASS.py5, CHAT_PANEL_PADDING_SM_PX6_CLASS]"
  >
    <div
      class="flex flex-col lg:flex-row lg:items-start lg:justify-between"
      :class="[FLEX_GAP_TOKEN_CLASS.gap4]"
    >
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <div>
          <!-- Level two: the page scaffold owns the single top-level heading. -->
          <h2 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl3]">
            {{ t("aiChatPage.title", { brand: brandName }) }}
          </h2>
          <p class="text-base text-secondary">{{ t("aiChatPage.subtitle") }}</p>
        </div>
        <!-- Below xl the sidebar is hidden; header owns context chips. At xl+ sidebar owns them. -->
        <div class="flex flex-wrap items-center xl:hidden" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <span :class="BADGE_SOFT_INFO_CLASS">
            {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
          </span>
          <span v-if="focusedEntityLabel" :class="BADGE_SOFT_PRIMARY_CLASS">
            {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
          </span>
          <span v-for="chip in contextChips" :key="chip" :class="BADGE_GHOST_CLASS">
            {{ chip }}
          </span>
        </div>
      </div>
      <button
        type="button"
        class="self-start"
        :class="[GHOST_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
        :aria-label="t('aiChatPage.clearAria')"
        @click="emit('clear')"
      >
        {{ t("aiChatPage.clearButton") }}
      </button>
    </div>
  </header>
</template>
