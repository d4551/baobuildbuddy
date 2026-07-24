<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { FAB_QUICK_ACTIONS } from "~/constants/dashboard-pipeline";
import {
  FAB_ACTION_MIN_WIDTH_CLASS,
  FAB_POSITION_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  PRIMARY_ACTION_CLASS,
  QUICK_ACTION_MENU_ID,
} from "~/constants/layout";

const { t } = useI18n();
const { resolvedBrand } = useBrand();
const route = useRoute();
const isOpen = ref(false);
const activeActionIndex = ref(0);
const quickActionMenuId = QUICK_ACTION_MENU_ID;
const actionButtonRef = useTemplateRef<HTMLButtonElement>("quickActionToggle");
const actionMenuRef = useTemplateRef<HTMLDivElement>("quickActionMenu");
const actionItemRefs = ref<(HTMLAnchorElement | null)[]>([]);

const closeQuickActions = (): void => {
  isOpen.value = false;
};

const openQuickActions = (): void => {
  isOpen.value = true;
};

watch(
  () => route.path,
  () => {
    closeQuickActions();
  },
);

watch(isOpen, async (nextOpen) => {
  if (nextOpen) {
    activeActionIndex.value = 0;
    actionItemRefs.value = new Array<HTMLAnchorElement | null>(FAB_QUICK_ACTIONS.length).fill(null);
    await nextTick();
    getActionItems()[activeActionIndex.value]?.focus();
    return;
  }

  await nextTick();
  actionButtonRef.value?.focus();
});

function getActionItems(): HTMLAnchorElement[] {
  return actionItemRefs.value.filter((element): element is HTMLAnchorElement => element !== null);
}

function setActiveActionRef(
  index: number,
  element: Element | ComponentPublicInstance | null,
): void {
  if (element === null) {
    actionItemRefs.value[index] = null;
    return;
  }
  let refEl: Element | null = null;
  if (element instanceof Element) {
    refEl = element;
  } else if (element.$el instanceof Element) {
    refEl = element.$el;
  }
  actionItemRefs.value[index] = refEl instanceof HTMLAnchorElement ? refEl : null;
}

function getActionIndex(currentIndex: number, direction: number): number {
  const actionItems = getActionItems();
  if (actionItems.length === 0) return 0;

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

  if (event.key === "Home") {
    event.preventDefault();
    activeActionIndex.value = 0;
    getActionItems()[0]?.focus();
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    const actionItems = getActionItems();
    const lastIndex = actionItems.length - 1;
    activeActionIndex.value = lastIndex;
    actionItems[lastIndex]?.focus();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const nextIndex = getActionIndex(index, 1);
    activeActionIndex.value = nextIndex;
    getActionItems()[nextIndex]?.focus();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    const previousIndex = getActionIndex(index, -1);
    activeActionIndex.value = previousIndex;
    getActionItems()[previousIndex]?.focus();
    return;
  }
}

function handleQuickActionButtonKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openQuickActions();
  }
}

function handleQuickActionMenuFocusOut(event: FocusEvent): void {
  const nextTarget = event.relatedTarget;
  if (!isOpen.value || !(nextTarget instanceof HTMLElement)) {
    return;
  }

  if (!actionMenuRef.value?.contains(nextTarget) && !actionButtonRef.value?.contains(nextTarget)) {
    closeQuickActions();
  }
}

function onWindowKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && isOpen.value) {
    closeQuickActions();
  }
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!isOpen.value) return;
  const target = event.target;
  if (!(target instanceof Node)) return;

  if (actionMenuRef.value?.contains(target) || actionButtonRef.value?.contains(target)) {
    return;
  }

  closeQuickActions();
}

onMounted(() => {
  window.addEventListener("pointerdown", handleDocumentPointerDown);
  window.addEventListener("keydown", onWindowKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("pointerdown", handleDocumentPointerDown);
  window.removeEventListener("keydown", onWindowKeyDown);
});
</script>

<template>
  <section 
    :class="['fab z-40 hidden lg:flex', FAB_POSITION_CLASS]"
    :aria-label="t('quickFab.groupAria', { brand: resolvedBrand.name })"
  >
    <button 
      ref="quickActionToggle"
      :class="[PRIMARY_ACTION_CLASS, 'btn-lg', 'btn-circle']"
      :aria-label="isOpen ? t('quickFab.collapseAria') : t('quickFab.expandAria')"
      :aria-expanded="isOpen"
      :aria-controls="quickActionMenuId"
      type="button"
      @keydown.escape.stop="closeQuickActions"
      @keydown="handleQuickActionButtonKeydown"
      @click="toggleQuickActions"
    >
      <CloseIcon v-if="isOpen" :class="ICON_SIZE_CLASS.md" />
      <IconPlus v-else :class="ICON_SIZE_CLASS.md" />
    </button>

    <Transition 
      enter-active-class="transition-[transform,opacity] duration-[var(--motion-standard)] ease-[var(--ease-enter)]"
      enter-from-class="translate-y-2 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition-[transform,opacity] duration-[var(--motion-fast)] ease-[var(--ease-exit)]"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-2 scale-95 opacity-0"
    >
      <div 
        v-if="isOpen"
        :id="quickActionMenuId"
        role="menu"
        tabindex="-1"
        class="flex flex-col items-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
        :aria-label="t('quickFab.menuAria')"
        ref="quickActionMenu"
        @focusout="handleQuickActionMenuFocusOut"
        aria-orientation="vertical"
        :aria-activedescendant="`quick-action-${activeActionIndex}`"
      >
        <NuxtLink 
          v-for="(action, index) in FAB_QUICK_ACTIONS"
          :key="action.id"
          :to="action.to"
          :id="`quick-action-${index}`"
          :class="[PRIMARY_ACTION_CLASS, 'btn-lg', 'justify-between transition-colors duration-[var(--motion-fast)] ease-[var(--ease-response)]', FAB_ACTION_MIN_WIDTH_CLASS]"
          role="menuitem"
          :tabindex="index === activeActionIndex ? 0 : -1"
          :aria-label="t(action.labelKey)"
          @keydown="handleQuickActionKeydown($event, index)"
          :ref="(element) => setActiveActionRef(index, element)"
          @click="closeQuickActions"
        >
          <span>{{ t(action.labelKey) }}</span>
          <svg :class="ICON_SIZE_CLASS.sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" :d="action.iconPath" />
          </svg>
        </NuxtLink>
      </div>
    </Transition>
  </section>
</template>
