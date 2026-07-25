<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  BADGE_GHOST_CLASS,
  BADGE_SOFT_INFO_CLASS,
  BADGE_SOFT_PRIMARY_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  LEADING_TOKEN_CLASS,
  MIN_HEIGHT_ZERO_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  currentContextLabel: string;
  focusedEntityLabel: string;
  contextChips: string[];
  contextualPrompts: string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  prompt: [prompt: string];
}>();

const { t } = useI18n();
</script>

<template>
  <!-- chatSplit stacks below xl; hide aside there so context/prompts aren't duplicated -->
  <aside class="hidden flex-col xl:flex" :class="[MIN_HEIGHT_ZERO_CLASS, FLEX_GAP_TOKEN_CLASS.gap4]">
    <section :class="[SURFACE_GLASS_CARD_CLASS, SHADOW_TOKEN_CLASS.sm]">
      <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h2 class="card-title text-base">{{ t("aiChatPage.contextPanelTitle") }}</h2>
        <p class="text-secondary" :class="[LEADING_TOKEN_CLASS.leading6, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("aiChatPage.contextPanelDescription") }}
        </p>
        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <span :class="BADGE_SOFT_INFO_CLASS">
            {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
          </span>
          <span v-if="focusedEntityLabel" :class="BADGE_SOFT_PRIMARY_CLASS">
            {{ t("floatingChat.focusedEntityBadge", { entity: focusedEntityLabel }) }}
          </span>
          <span v-for="chip in contextChips" :key="`aside-${chip}`" :class="BADGE_GHOST_CLASS">
            {{ chip }}
          </span>
        </div>
      </div>
    </section>

    <section :class="[SURFACE_GLASS_CARD_CLASS, SHADOW_TOKEN_CLASS.sm]">
      <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h2 class="card-title text-base">{{ t("aiChatPage.promptsTitle") }}</h2>
        <p class="text-secondary" :class="[LEADING_TOKEN_CLASS.leading6, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("aiChatPage.promptsDescription") }}
        </p>
        <ChatPromptChips
          :prompts="contextualPrompts"
          :loading="loading"
          @prompt="emit('prompt', $event)"
        />
      </div>
    </section>
  </aside>
</template>
