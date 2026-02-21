<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { QUICK_ACTION_MENU_ID } from "~/constants/layout";
import { FAB_QUICK_ACTIONS } from "~/constants/dashboard";
import CloseIcon from "~/components/ui/CloseIcon.vue";

const { t } = useI18n();
const route = useRoute();
const isOpen = ref(false);
const quickActionMenuId = QUICK_ACTION_MENU_ID;

watch(
  () => route.path,
  () => {
    isOpen.value = false;
  },
);

function toggleQuickActions() {
  isOpen.value = !isOpen.value;
}

function closeQuickActions() {
  isOpen.value = false;
}

function onWindowKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeQuickActions();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onWindowKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onWindowKeyDown);
});
</script>

<template>
  <div class="fab z-[50] left-6 bottom-24 hidden lg:flex" :aria-label="t('quickFab.groupAria', { brand: APP_BRAND.name })">
    <button
      class="btn btn-lg btn-circle btn-primary shadow-lg"
      :aria-label="isOpen ? t('quickFab.collapseAria') : t('quickFab.expandAria')"
      :aria-expanded="isOpen"
      :aria-controls="quickActionMenuId"
      type="button"
      @click="toggleQuickActions"
    >
      <CloseIcon v-if="isOpen" class="h-6 w-6" />
      <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      :id="quickActionMenuId"
      class="flex flex-col items-end gap-2"
      :aria-label="t('quickFab.menuAria')"
    >
      <NuxtLink
        v-for="action in FAB_QUICK_ACTIONS"
        :key="action.id"
        :to="action.to"
        class="btn btn-lg justify-between min-w-52"
        :aria-label="t(action.labelKey)"
        @click="closeQuickActions"
      >
        <span>{{ t(action.labelKey) }}</span>
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.iconPath" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>
