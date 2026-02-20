<script setup lang="ts">
import { APP_BRAND, APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  error: {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
  };
}>();

const { t } = useI18n();
const message = computed(() => {
  return props.error.statusMessage || props.error.message || t("errorPage.fallbackMessage");
});
</script>

<template>
  <div class="min-h-screen hero bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-lg space-y-4">
        <h1 class="text-4xl font-bold">{{ t("errorPage.title", { brand: APP_BRAND.name }) }}</h1>
        <p class="text-base-content/70">
          {{ message }}
        </p>
        <div role="alert" class="alert alert-info">
          <span>Status: {{ error.statusCode || 500 }}</span>
        </div>
        <div class="flex justify-center gap-2">
          <NuxtLink :to="APP_ROUTES.dashboard" class="btn btn-primary">Back to dashboard</NuxtLink>
          <button class="btn btn-ghost" @click="clearError({ redirect: APP_ROUTES.dashboard })">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>
