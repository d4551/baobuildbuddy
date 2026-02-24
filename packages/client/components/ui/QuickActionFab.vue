<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { FAB_QUICK_ACTIONS } from "~/constants/dashboard";
import { QUICK_ACTION_MENU_ID } from "~/constants/layout";

const { t } = useI18n();
const route = useRoute();
const isOpen = ref(false);
const quickActionMenuId = QUICK_ACTION_MENU_ID;
const actionButtonRef = useTemplateRef<HTMLButtonElement>("quickActionToggle");

const closeQuickActions = (): void => {
  isOpen.value = false;
};

watch(
  () => route.path,
  () => {
    closeQuickActions();
  },
);

watch(isOpen, (nextOpen) => {
  if (nextOpen) {
    nextTick(() => {
      const actionItems = getActionItems();
      actionItems[0]?.focus();
    });
    return;
  }

  nextTick(() => {
    actionButtonRef.value?.focus();
  });
});

function getActionItems(): HTMLAnchorElement[] {
  const menuElement = document.getElementById(quickActionMenuId);
  if (!menuElement) return [];
  return Array.from(menuElement.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']"));
}

function getActionIndex(currentIndex: number, direction: number): number {
  const actionItems = getActionItems();
  if (!actionItems.length) return 0;

  const maxIndex = actionItems.length - 1;
  if (direction === 1) {
    return currentIndex >= maxIndex ? 0 : currentIndex + 1;
  }

  return currentIndex <= 0 ? maxIndex : currentIndex - 1;
}

function toggleQuickActions(): void {
  isOpen.value = !isOpen.value;
}

function handleQuickActionKeydown(event: KeyboardEvent, index: number): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeQuickActions();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const nextIndex = getActionIndex(index, 1);
    getActionItems()[nextIndex]?.focus();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    const previousIndex = getActionIndex(index, -1);
    getActionItems()[previousIndex]?.focus();
  }
}

function onWindowKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && isOpen.value) {
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
      ref="quickActionToggle"
      class="btn btn-lg btn-circle btn-primary shadow-lg"
      :aria-label="isOpen ? t('quickFab.collapseAria') : t('quickFab.expandAria')"
      :aria-expanded="isOpen"
      :aria-controls="quickActionMenuId"
      type="button"
      @keydown.escape.stop="closeQuickActions"
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
      role="menu"
      class="flex flex-col items-end gap-2"
      :aria-label="t('quickFab.menuAria')"
    >
      <NuxtLink
        v-for="(action, index) in FAB_QUICK_ACTIONS"
        :key="action.id"
        :to="action.to"
        class="btn btn-lg justify-between min-w-52"
        role="menuitem"
        :aria-label="t(action.labelKey)"
        :aria-hidden="!isOpen"
        @keydown="handleQuickActionKeydown($event, index)"
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
