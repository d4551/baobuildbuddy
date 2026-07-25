<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";

definePageMeta({
  middleware: ["auth"],
  redirect: APP_ROUTES.aiChat,
});
</script>

<template>
  <div />
</template>
