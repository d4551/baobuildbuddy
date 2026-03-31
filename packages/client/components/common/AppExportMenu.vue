<script setup lang="ts">
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

const menu = ref<HTMLDetailsElement | null>(null);
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

function emitExport(format: ExportFormat): void {
  emit("export", format);
  if (menu.value) {
    menu.value.open = false;
  }
}
</script>

<template>
  <details ref="menu" class="dropdown dropdown-end">
    <summary
      class="list-none"
      :class="props.summaryClass"
      :aria-label="props.buttonAriaLabel"
      :aria-disabled="props.disabled"
      :tabindex="props.disabled ? -1 : 0"
    >
      <IconDownload class="h-4 w-4" />
      {{ props.buttonLabel }}
    </summary>

    <ul
      class="menu dropdown-content z-20 mt-2 w-40 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      :aria-label="props.buttonAriaLabel"
    >
      <li>
        <button
          type="button"
          :disabled="props.disabled"
          :aria-label="exportFormatAriaLabel('pdf')"
          @click="emitExport('pdf')"
        >
          {{ formatLabels.pdf }}
        </button>
      </li>
      <li>
        <button
          type="button"
          :disabled="props.disabled"
          :aria-label="exportFormatAriaLabel('docx')"
          @click="emitExport('docx')"
        >
          {{ formatLabels.docx }}
        </button>
      </li>
    </ul>
  </details>
</template>
