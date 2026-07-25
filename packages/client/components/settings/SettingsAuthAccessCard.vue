<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { assertApiResponse, settlePromise, withLoadingState } from "~/composables/async-flow";
import { useApi } from "~/composables/useApi";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();
const api = useApi();
const { $toast } = useNuxtApp();

const loading = ref(false);
const configured = ref(false);
const rotatedKey = ref("");
const statusLoaded = ref(false);

async function refreshConfigured(): Promise<void> {
  await withLoadingState(loading, async () => {
    const { data, error } = await api.auth.configured.get();
    assertApiResponse(error, t("settings.authAccess.statusFailed"));
    configured.value = Boolean(data?.configured);
    statusLoaded.value = true;
  });
}

async function handleRotate(): Promise<void> {
  const result = await settlePromise(
    withLoadingState(loading, async () => {
      const { data, error } = await api.auth.rotate.post();
      assertApiResponse(error, t("settings.authAccess.rotateFailed"));
      return data;
    }),
    t("settings.authAccess.rotateFailed"),
  );
  if (!result.ok) {
    $toast.error(getErrorMessage(result.error, t("settings.authAccess.rotateFailed")));
    return;
  }
  rotatedKey.value = typeof result.value?.apiKey === "string" ? result.value.apiKey : "";
  configured.value = true;
  $toast.success(t("settings.authAccess.rotateSuccess"));
}

async function handleRevoke(): Promise<void> {
  const result = await settlePromise(
    withLoadingState(loading, async () => {
      const { error } = await api.auth.revoke.post();
      assertApiResponse(error, t("settings.authAccess.revokeFailed"));
    }),
    t("settings.authAccess.revokeFailed"),
  );
  if (!result.ok) {
    $toast.error(getErrorMessage(result.error, t("settings.authAccess.revokeFailed")));
    return;
  }
  rotatedKey.value = "";
  configured.value = false;
  $toast.success(t("settings.authAccess.revokeSuccess"));
}

onMounted(() => {
  settlePromise(refreshConfigured(), t("settings.authAccess.statusFailed")).then(
    (result) => {
      if (!result.ok) {
        statusLoaded.value = true;
      }
      return undefined;
    },
    () => {
      statusLoaded.value = true;
      return undefined;
    },
  );
});
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <div>
          <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.base]">
            {{ t("settings.authAccess.title") }}
          </h3>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm, MARGIN_TOKEN_CLASS.mt1]">
            {{ t("settings.authAccess.description") }}
          </p>
        </div>

        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]" role="status" aria-live="polite">
          <template v-if="!statusLoaded || loading">{{ t("common.loading") }}</template>
          <template v-else-if="configured">{{ t("settings.authAccess.configuredYes") }}</template>
          <template v-else>{{ t("settings.authAccess.configuredNo") }}</template>
        </p>

        <div v-if="rotatedKey" class="alert alert-warning" role="status">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <p class="font-medium">{{ t("settings.authAccess.newKeyTitle") }}</p>
            <code class="break-all" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ rotatedKey }}</code>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("settings.authAccess.newKeyHint") }}</p>
          </div>
        </div>

        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <button
            type="button"
            :class="[PRIMARY_ACTION_CLASS]"
            :aria-label="t('settings.authAccess.rotateAria')"
            :disabled="loading || !configured"
            @click="handleRotate"
          >
            {{ t("settings.authAccess.rotateButton") }}
          </button>
          <button
            type="button"
            :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('settings.authAccess.revokeAria')"
            :disabled="loading || !configured"
            @click="handleRevoke"
          >
            {{ t("settings.authAccess.revokeButton") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
