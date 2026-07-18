<script setup lang="ts">
import {
  DROPDOWN_MENU_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
} from "~/constants/layout";
import { useI18n } from "vue-i18n";

type ExportFormat = "pdf" | "docx";

interface AppExportMenuProps {
  readonly buttonLabel: string;
  readonly buttonAriaLabel: string;
  readonly disabled?: boolean;
  readonly summaryClass?: string;
}

const props = withDefaults(defineProps<AppExportMenuProps>(), {
  disabled: false,
  summaryClass: "btn btn-primary",
});

const emit = defineEmits<{
  export: [format: ExportFormat];
}>();

const exportFormats: readonly ExportFormat[] = ["pdf", "docx"];
const exportMenuId = `app-export-menu-${useId()}`;
const exportTriggerId = `app-export-trigger-${useId()}`;
const menu = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activeFormatIndex = ref(0);
const trigger = useTemplateRef<HTMLButtonElement>("exportTrigger");
const { t } = useI18n();
const formatLabels = computed(() => ({
  docx: t("common.exportMenu.formats.docx"),
  pdf: t("common.exportMenu.formats.pdf"),
}));

function exportFormatAriaLabel(format: ExportFormat): string {
  return t("common.exportMenu.formatAria", {
    action: props.buttonLabel,
    format: formatLabels.value[format],
  });
}

function getMenuItems(): HTMLButtonElement[] {
  return Array.from(
    menu.value?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]') ?? [],
  );
}

function focusMenuItem(index: number): void {
  activeFormatIndex.value = index;
  getMenuItems()[index]?.focus();
}

function getMenuIndex(currentIndex: number, direction: number): number {
  const menuItems = getMenuItems();
  if (!menuItems.length) {
    return 0;
  }

  const maxIndex = menuItems.length - 1;
  if (direction === 1) {
    return currentIndex >= maxIndex ? 0 : currentIndex + 1;
  }

  return currentIndex <= 0 ? maxIndex : currentIndex - 1;
}

async function openMenu(startingIndex = 0): Promise<void> {
  if (props.disabled) {
    return;
  }

  activeFormatIndex.value = startingIndex;
  isOpen.value = true;

  await nextTick();
  if (isOpen.value) {
    focusMenuItem(startingIndex);
  }
}

function closeMenu(): void {
  isOpen.value = false;
  activeFormatIndex.value = 0;
}

function toggleMenu(): void {
  if (isOpen.value) {
    closeMenu();
    return;
  }

  void openMenu();
}

function handleTriggerClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  toggleMenu();
}

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    void openMenu(0);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    void openMenu(exportFormats.length - 1);
    return;
  }

  if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    toggleMenu();
  }
}

function handleMenuItemKeydown(event: KeyboardEvent, index: number): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    focusMenuItem(0);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    focusMenuItem(exportFormats.length - 1);
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    focusMenuItem(getMenuIndex(index, 1));
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    focusMenuItem(getMenuIndex(index, -1));
    return;
  }

  if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    emitExport(exportFormats[index]);
    return;
  }

  if (event.key === "Tab") {
    closeMenu();
  }
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!isOpen.value) {
    return;
  }

  const pointerPath = event.composedPath();
  if (!menu.value || !pointerPath.includes(menu.value)) {
    closeMenu();
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (isOpen.value && event.key === "Escape") {
    event.preventDefault();
    closeMenu();
  }
}

function handleMenuFocusOut(event: FocusEvent): void {
  const nextTarget = event.relatedTarget;
  if (!isOpen.value) {
    return;
  }

  if (!(nextTarget instanceof Node)) {
    closeMenu();
    return;
  }

  if (!menu.value?.contains(nextTarget)) {
    closeMenu();
  }
}

watch(isOpen, (nextOpen, previousOpen) => {
  if (previousOpen) {
    void nextTick(() => {
      trigger.value?.focus();
    });
  }
});

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.removeEventListener("keydown", handleDocumentKeydown);
});

function emitExport(format: ExportFormat): void {
  emit("export", format);
  closeMenu();
}
</script>

<template>
  <div ref="menu" class="dropdown dropdown-end" :class="{ 'dropdown-open': isOpen }">
    <button
      :id="exportTriggerId"
      ref="exportTrigger"
      type="button"
      class="list-none"
      :class="props.summaryClass"
      :aria-label="props.buttonAriaLabel"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="exportMenuId"
      :disabled="props.disabled"
      @click="handleTriggerClick"
      @keydown="handleTriggerKeydown"
    >
      <IconDownload :class="ICON_SIZE_CLASS['4']" />
      {{ props.buttonLabel }}
    </button>

    <ul
      v-show="isOpen"
      :id="exportMenuId"
      class="menu dropdown-content z-20 rounded-box border border-base-300 bg-base-100" :class="[DROPDOWN_MENU_WIDTH_CLASS, PADDING_TOKEN_CLASS.p2, MARGIN_TOKEN_CLASS.mt2, SHADOW_TOKEN_CLASS.lg]"
      role="menu"
      aria-orientation="vertical"
      :aria-labelledby="exportTriggerId"
      :aria-label="props.buttonAriaLabel"
      @focusout="handleMenuFocusOut"
    >
      <li v-for="(format, index) in exportFormats" :key="format" role="none">
        <button
          :id="`${exportMenuId}-${format}`"
          type="button"
          role="menuitem"
          :disabled="props.disabled"
          :tabindex="index === activeFormatIndex ? 0 : -1"
          :aria-label="exportFormatAriaLabel(format)"
          @keydown="handleMenuItemKeydown($event, index)"
          @click.stop="emitExport(format)"
        >
          {{ formatLabels[format] }}
        </button>
      </li>
    </ul>
  </div>
</template>
