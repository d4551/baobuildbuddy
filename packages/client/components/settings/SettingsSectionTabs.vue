<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import WorkspaceSectionNavigator from "~/components/ui/WorkspaceSectionNavigator.vue";
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
    <div class="min-w-0">
      <section
        v-for="section in SETTINGS_SECTION_ITEMS"
        :id="`settings-section-panel-${section.id}`"
        :key="section.id"
        :aria-hidden="activeSection !== section.id"
        v-show="activeSection === section.id"
      >
        <slot :name="section.slotName" />
      </section>
    </div>
  </WorkspaceSectionNavigator>
</template>
