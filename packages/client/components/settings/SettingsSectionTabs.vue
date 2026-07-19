<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import WorkspaceSectionNavigator from "~/components/ui/WorkspaceSectionNavigator.vue";
import { TRUNCATE_FLEX_CHILD_CLASS } from "~/constants/layout";
import { SETTINGS_SECTION_ITEMS, type SettingsSectionId } from "./settings-sections";

const activeSection = defineModel<SettingsSectionId>("activeSection", {
  required: true,
});
</script>

<template>
  <WorkspaceSectionNavigator
    :sections="SETTINGS_SECTION_ITEMS"
    :active-section="activeSection"
    v-bind="{ ariaLabelKey: 'settings.title' }"
    fallback-description-key="settings.subtitle"
    :build-route="APP_ROUTE_BUILDERS.settingsSection"
  >
    <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
      <!-- Mount only the active panel — keeps mobile DOM lean. -->
      <template v-for="section in SETTINGS_SECTION_ITEMS" :key="section.id">
        <section
          v-if="activeSection === section.id"
          :id="`settings-section-panel-${section.id}`"
        >
          <slot :name="section.slotName" />
        </section>
      </template>
    </div>
  </WorkspaceSectionNavigator>
</template>
