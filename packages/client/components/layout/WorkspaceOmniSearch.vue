<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  resolveWorkspaceSearchResultRoute,
  useWorkspaceSearch,
} from "~/composables/useWorkspaceSearch";

const WORKSPACE_SEARCH_DIALOG_TITLE_ID = "workspace-omni-search-title";

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

async function submitSearch(): Promise<void> {
  await search();
}

async function openResult(result: (typeof results.value)[number]): Promise<void> {
  open.value = false;
  clear();
  await router.push(resolveWorkspaceSearchResultRoute(result));
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
      class="btn btn-ghost btn-circle"
      :class="[TOUCH_TARGET_MIN_CLASS]"
      :aria-label="t('workspaceSearch.openButtonAria')"
      :aria-expanded="open"
      :aria-controls="WORKSPACE_SEARCH_DIALOG_TITLE_ID"
      @click="open = true"
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
            class="btn btn-primary"
            :class="[TOUCH_TARGET_MIN_CLASS]"
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
              class="btn btn-ghost justify-start text-left"
              :class="[FLUID_WIDTH_CLASS, TOUCH_TARGET_MIN_CLASS]"
              :aria-label="t('workspaceSearch.suggestionAria', { text: suggestion.text })"
              @click="applySuggestion(suggestion)"
            >
              <span class="badge badge-soft badge-sm shrink-0">{{ typeLabel(suggestion.type) }}</span>
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
        />

        <EmptyState
          v-else-if="!loading && !suggesting && results.length === 0 && suggestions.length === 0"
          title-key="workspaceSearch.noResultsTitle"
          description-key="workspaceSearch.noResultsDescription"
        />

        <ul v-else-if="results.length > 0" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]" :aria-label="t('workspaceSearch.title')">
          <li v-for="result in results" :key="`${result.type}-${result.id}`">
            <button
              type="button"
              class="btn btn-ghost justify-start text-left"
              :class="[FLUID_WIDTH_CLASS, TOUCH_TARGET_MIN_CLASS]"
              :aria-label="t('workspaceSearch.resultAria', { title: result.title })"
              @click="openResult(result)"
            >
              <span class="badge badge-soft badge-sm shrink-0">{{ typeLabel(result.type) }}</span>
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
