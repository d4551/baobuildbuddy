<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { settle } from "@bao/shared/utils/promise";
import { useI18n } from "vue-i18n";
import {
  resolveWorkspaceSearchResultRoute,
  useWorkspaceSearch,
  WORKSPACE_OMNI_SEARCH_OPEN_EVENT,
} from "~/composables/useWorkspaceSearch";
import {
  BADGE_SOFT_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CIRCLE_DENSE_CLASS,
  GHOST_ACTION_CLASS,
  ICON_SIZE_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const WORKSPACE_SEARCH_DIALOG_TITLE_ID = "workspace-omni-search-title";
const WORKSPACE_SEARCH_INPUT_ID = "workspace-omni-search-input";

const { t } = useI18n();
const {
  applySuggestion,
  clear,
  loading,
  open,
  query,
  results,
  scheduleAutocomplete,
  suggesting,
  suggestions,
  search,
} = useWorkspaceSearch();
const router = useRouter();

function focusSearchInput(): void {
  const input = document.getElementById(WORKSPACE_SEARCH_INPUT_ID);
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.select();
  }
}

function handleOpenOmniSearchEvent(): void {
  open.value = true;
  settle(Promise.resolve(nextTick())).then(
    () => {
      focusSearchInput();
    },
    () => undefined,
  );
}

onMounted(() => {
  window.addEventListener(WORKSPACE_OMNI_SEARCH_OPEN_EVENT, handleOpenOmniSearchEvent);
});

onUnmounted(() => {
  window.removeEventListener(WORKSPACE_OMNI_SEARCH_OPEN_EVENT, handleOpenOmniSearchEvent);
});

async function submitSearch(): Promise<void> {
  await search();
}

async function openResult(result: (typeof results.value)[number]): Promise<void> {
  open.value = false;
  clear();
  await router.push(resolveWorkspaceSearchResultRoute(result));
}

function openSearch(): void {
  open.value = true;
}

function closeSearch(): void {
  open.value = false;
  clear();
}

function onQueryInput(): void {
  scheduleAutocomplete(query.value);
}

function typeLabel(type: string): string {
  const key = `workspaceSearch.typeLabel.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}
</script>

<template>
  <div>
    <button
      type="button"
 
 :class="[GHOST_ACTION_CIRCLE_DENSE_CLASS, TOUCH_TARGET_MIN_CLASS]"
 :aria-label="t('workspaceSearch.openButtonAria')"
 :aria-expanded="open"
 :aria-controls="WORKSPACE_SEARCH_DIALOG_TITLE_ID"
 @click="openSearch"
 >
      <IconSearch :class="ICON_SIZE_CLASS.sm" />
    </button>

    <AppModalFrame
      v-model:open="open"
      :title-id="WORKSPACE_SEARCH_DIALOG_TITLE_ID"
      size-token="compact"
      :close-aria-label="t('workspaceSearch.closeAria')"
      :close-backdrop-label="t('workspaceSearch.closeAria')"
      @close="closeSearch"
    >
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <h2 :id="WORKSPACE_SEARCH_DIALOG_TITLE_ID" class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
          {{ t("workspaceSearch.title") }}
        </h2>

        <form
          class="flex"
          :class="[FLEX_GAP_TOKEN_CLASS.gap2, FLUID_WIDTH_CLASS]"
          @submit.prevent="submitSearch"
        >
          <input
            :id="WORKSPACE_SEARCH_INPUT_ID"
            v-model="query"
            type="search"
            class="input"
            :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('workspaceSearch.placeholder')"
            :aria-label="t('workspaceSearch.inputAria')"
            autocomplete="off"
            @input="onQueryInput"
          />
          <button
            type="submit"
            :class="[PRIMARY_ACTION_CLASS]"
            :aria-label="t('workspaceSearch.submitAria')"
            :disabled="loading || query.trim().length < 2"
          >
            <LoadingSpinner v-if="loading" size="xs" :label="t('workspaceSearch.submitButton')" />
            <span v-else>{{ t("workspaceSearch.submitButton") }}</span>
          </button>
        </form>

        <ul
          v-if="suggestions.length > 0 && results.length === 0"
          :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]"
          :aria-label="t('workspaceSearch.suggestionsAria')"
        >
          <li v-for="suggestion in suggestions" :key="`${suggestion.type}-${suggestion.text}`">
            <button
              type="button"
 class="justify-start text-start"
 :class="[GHOST_ACTION_CLASS, FLUID_WIDTH_CLASS, TOUCH_TARGET_MIN_CLASS]"
 :aria-label="t('workspaceSearch.suggestionAria', { text: suggestion.text })"
 @click="applySuggestion(suggestion)"
 >
              <span :class="[BADGE_SOFT_SM_CLASS, 'shrink-0']">{{ typeLabel(suggestion.type) }}</span>
              <span class="truncate" :class="[TRUNCATE_FLEX_CHILD_CLASS]">{{ suggestion.text }}</span>
            </button>
          </li>
        </ul>

        <p
          v-else-if="suggesting && query.trim().length >= 2 && results.length === 0"
          class="text-secondary"
          :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
        >
          {{ t("workspaceSearch.submitButton") }}…
        </p>

        <EmptyState
          v-if="query.trim().length < 2"
          title-key="workspaceSearch.emptyTitle"
          description-key="workspaceSearch.emptyDescription"
          cta-label-key="workspaceSearch.emptyCta"
          cta-aria-key="workspaceSearch.emptyCtaAria"
          :cta-to="APP_ROUTES.jobs"
        />

        <EmptyState
          v-else-if="!loading && !suggesting && results.length === 0 && suggestions.length === 0"
          title-key="workspaceSearch.noResultsTitle"
          description-key="workspaceSearch.noResultsDescription"
          cta-label-key="workspaceSearch.noResultsCta"
          cta-aria-key="workspaceSearch.noResultsCtaAria"
          @cta="clear"
        />

        <ul v-else-if="results.length > 0" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]" :aria-label="t('workspaceSearch.title')">
          <li v-for="result in results" :key="`${result.type}-${result.id}`">
            <button
              type="button"
 class="justify-start text-start"
 :class="[GHOST_ACTION_CLASS, FLUID_WIDTH_CLASS, TOUCH_TARGET_MIN_CLASS]"
 :aria-label="t('workspaceSearch.resultAria', { title: result.title })"
 @click="openResult(result)"
 >
              <span :class="[BADGE_SOFT_SM_CLASS, 'shrink-0']">{{ typeLabel(result.type) }}</span>
              <span class="flex-1 truncate" :class="[TRUNCATE_FLEX_CHILD_CLASS]">
                <span class="font-medium">{{ result.title }}</span>
                <span v-if="result.subtitle" class="text-secondary block truncate" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ result.subtitle }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </AppModalFrame>
  </div>
</template>
