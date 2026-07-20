<script setup lang="ts">
import {
  VISIBILITY_HIDE_BELOW_LG_CLASS,
  VISIBILITY_SHOW_BELOW_LG_CLASS,
} from "~/constants/ui-layout";
import { FLUID_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";
</script>

<template>
  <!-- Card stack below lg; dense table from lg — kills horizontal UUID table scroll @320. -->
  <div :class="[FLUID_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack3]">
    <div :class="[VISIBILITY_SHOW_BELOW_LG_CLASS, FLUID_WIDTH_CLASS]">
      <slot name="cards" />
    </div>
    <div class="overflow-x-auto" :class="[VISIBILITY_HIDE_BELOW_LG_CLASS, FLUID_WIDTH_CLASS]">
      <slot name="table" />
    </div>
  </div>
</template>
