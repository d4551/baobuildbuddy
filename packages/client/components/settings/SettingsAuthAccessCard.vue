<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise, withLoadingState } from "~/composables/async-flow";
import { useApi } from "~/composables/useApi";
import { useAuth } from "~/composables/useAuth";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();
const api = useApi();
const { checkAuthStatus } = useAuth();
const { $toast } = useNuxtApp();

const actionLoading = ref(false);
const rotatedKey = ref("");

const {
  data: authStatus,
  pending: statusPending,
  error: statusError,
  refresh: refreshAuthStatus,
} = await useAsyncData("settings-auth-access-card", () => checkAuthStatus(), {
  server: true,
  lazy: false,
  default: () => ({
    authRequired: true,
    configured: false,
    bootstrapRequired: true,
    setupTokenConfigured: false,
  }),
});

const authRequired = computed(() => authStatus.value?.authRequired !== false);
const configured = computed(() => authStatus.value?.configured === true);
const bootstrapRequired = computed(() => authStatus.value?.bootstrapRequired === true);

const statusLabel = computed(() => {
  if (statusPending.value && !authStatus.value) {
    return t("common.loading");
  }
  if (statusError.value) {
    return t("settings.authAccess.statusFailed");
  }
  if (!authRequired.value) {
    return t("settings.authAccess.authDisabled");
  }
  if (bootstrapRequired.value || !configured.value) {
    return t("settings.authAccess.configuredNo");
  }
  return t("settings.authAccess.configuredYes");
});

const canRotate = computed(
  () => authRequired.value && configured.value && !bootstrapRequired.value && !actionLoading.value,
);
const canRevoke = computed(() => canRotate.value);
const showSetupCta = computed(
  () =>
    !statusPending.value && authRequired.value && (bootstrapRequired.value || !configured.value),
);

async function handleRotate(): Promise<void> {
  const result = await settlePromise(
    withLoadingState(actionLoading, async () => {
      const { data, error } = await api.auth.rotate.post();
      if (error) {
        throw new Error(t("settings.authAccess.rotateFailed"));
      }
      return data;
    }),
    t("settings.authAccess.rotateFailed"),
  );
  if (!result.ok) {
    $toast.error(getErrorMessage(result.error, t("settings.authAccess.rotateFailed")));
    return;
  }
  rotatedKey.value = typeof result.value?.apiKey === "string" ? result.value.apiKey : "";
  await refreshAuthStatus();
  $toast.success(t("settings.authAccess.rotateSuccess"));
}

async function handleRevoke(): Promise<void> {
  const result = await settlePromise(
    withLoadingState(actionLoading, async () => {
      const { error } = await api.auth.revoke.post();
      if (error) {
        throw new Error(t("settings.authAccess.revokeFailed"));
      }
    }),
    t("settings.authAccess.revokeFailed"),
  );
  if (!result.ok) {
    $toast.error(getErrorMessage(result.error, t("settings.authAccess.revokeFailed")));
    return;
  }
  rotatedKey.value = "";
  await refreshAuthStatus();
  $toast.success(t("settings.authAccess.revokeSuccess"));
}
</script>

<template>
  <UiGlassCard>
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

        <p
          class="text-secondary"
          :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
          role="status"
          aria-live="polite"
          data-testid="settings-auth-access-status"
        >
          {{ statusLabel }}
        </p>

        <div v-if="rotatedKey" class="alert alert-warning" role="status">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <p class="font-medium">{{ t("settings.authAccess.newKeyTitle") }}</p>
            <code class="break-all" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ rotatedKey }}</code>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("settings.authAccess.newKeyHint") }}</p>
          </div>
        </div>

        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <NuxtLink
            v-if="showSetupCta"
            :to="APP_ROUTES.setup"
            :class="[PRIMARY_ACTION_CLASS]"
            :aria-label="t('settings.authAccess.setupAria')"
          >
            {{ t("settings.authAccess.setupButton") }}
          </NuxtLink>
          <button
            type="button"
            :class="[PRIMARY_ACTION_CLASS]"
            :aria-label="t('settings.authAccess.rotateAria')"
            :disabled="!canRotate"
            @click="handleRotate"
          >
            {{ t("settings.authAccess.rotateButton") }}
          </button>
          <button
            type="button"
            :class="[OUTLINE_ACTION_CLASS]"
            :aria-label="t('settings.authAccess.revokeAria')"
            :disabled="!canRevoke"
            @click="handleRevoke"
          >
            {{ t("settings.authAccess.revokeButton") }}
          </button>
        </div>
      </div>
    </div>
  </UiGlassCard>
</template>
