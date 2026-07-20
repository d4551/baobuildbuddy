<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";

definePageMeta({
  middleware: ["auth"],
});

await navigateTo(APP_ROUTES.aiChat, { replace: true });
</script>

<template>
  <div />
</template>
