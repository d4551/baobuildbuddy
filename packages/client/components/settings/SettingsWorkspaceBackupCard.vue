<script setup lang="ts">
import { safeParseJson } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { SettingsWorkspaceExportPayload } from "~/types/client-api-workspace";
import { getErrorMessage } from "~/utils/errors";

const emit = defineEmits<{
  exported: [];
  imported: [];
}>();

const { t } = useI18n();
const { exportWorkspace, importWorkspace } = useSettings();
const { $toast } = useNuxtApp();
const pending = ref(false);
const fileInputRef = useTemplateRef<HTMLInputElement>("backupFileInput");

async function handleExport(): Promise<void> {
  pending.value = true;
  const result = await settlePromise(exportWorkspace(), t("apiErrors.settings.exportFailed"));
  pending.value = false;
  if (!result.ok) {
    $toast.error(getErrorMessage(result.error, t("apiErrors.settings.exportFailed")));
    return;
  }
  const blob = new Blob([JSON.stringify(result.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bao-workspace-backup-${result.value.exportedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  $toast.success(t("settings.preferences.exportSuccess"));
  emit("exported");
}

function requestImportPicker(): void {
  fileInputRef.value?.click();
}

async function handleImportFile(event: Event): Promise<void> {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
    return;
  }
  const file = input.files[0];
  input.value = "";
  const textResult = await settlePromise(file.text(), t("settings.preferences.importInvalid"));
  if (!textResult.ok) {
    $toast.error(t("settings.preferences.importInvalid"));
    return;
  }
  const parsed = safeParseJson(textResult.value);
  if (!isRecord(parsed) || typeof parsed.version !== "string" || typeof parsed.exportedAt !== "string") {
    $toast.error(t("settings.preferences.importInvalid"));
    return;
  }
  const payload = parsed as SettingsWorkspaceExportPayload;
  pending.value = true;
  const result = await settlePromise(importWorkspace(payload), t("apiErrors.settings.importFailed"));
  pending.value = false;
  if (!result.ok) {
    $toast.error(getErrorMessage(result.error, t("apiErrors.settings.importFailed")));
    return;
  }
  $toast.success(t("settings.preferences.importSuccess"));
  emit("imported");
}
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <div>
          <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.base]">
            {{ t("settings.preferences.workspaceBackupTitle") }}
          </h3>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm, MARGIN_TOKEN_CLASS.mt1]">
            {{ t("settings.preferences.workspaceBackupDescription") }}
          </p>
        </div>
        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <button
            type="button"
            :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('settings.preferences.exportAria')"
            :disabled="pending"
            @click="handleExport"
          >
            <LoadingSpinner v-if="pending" size="xs" :label="t('settings.preferences.exportButton')" />
            <span v-else>{{ t("settings.preferences.exportButton") }}</span>
          </button>
          <button
            type="button"
            :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('settings.preferences.importAria')"
            :disabled="pending"
            @click="requestImportPicker"
          >
            {{ t("settings.preferences.importButton") }}
          </button>
          <input
            ref="backupFileInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            :aria-label="t('settings.preferences.importFileAria')"
            @change="handleImportFile"
          />
        </div>
      </div>
    </div>
  </div>
</template>
