<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import {
  getSettingsSectionById,
  SETTINGS_SECTION_COUNT,
  SETTINGS_SECTION_ITEMS,
  type SettingsSectionId,
  type SettingsSectionItem,
} from "./settings-sections";

const activeSection = defineModel<SettingsSectionId>("activeSection", {
  required: true,
});

const { t } = useI18n();

const activeSectionEntry = computed<SettingsSectionItem>(() =>
  getSettingsSectionById(activeSection.value),
);

function focusSettingsSectionControl(sectionId: SettingsSectionId): void {
  if (!import.meta.client) {
    return;
  }

  requestAnimationFrame(() => {
    document.getElementById(`settings-section-control-${sectionId}`)?.focus();
  });
}

function setActiveSection(sectionId: SettingsSectionId, options?: { focusTab?: boolean }): void {
  activeSection.value = sectionId;
  if (options?.focusTab) {
    focusSettingsSectionControl(sectionId);
  }
}

function handleSettingsSectionKeydown(event: KeyboardEvent, sectionId: SettingsSectionId): void {
  const currentIndex = SETTINGS_SECTION_ITEMS.findIndex((section) => section.id === sectionId);

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    const nextSection =
      SETTINGS_SECTION_ITEMS[(currentIndex + 1) % SETTINGS_SECTION_ITEMS.length]?.id;
    if (nextSection) {
      setActiveSection(nextSection, { focusTab: true });
    }
    return;
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    const previousSection =
      SETTINGS_SECTION_ITEMS[
        (currentIndex - 1 + SETTINGS_SECTION_ITEMS.length) % SETTINGS_SECTION_ITEMS.length
      ]?.id;
    if (previousSection) {
      setActiveSection(previousSection, { focusTab: true });
    }
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    const firstSection = SETTINGS_SECTION_ITEMS[0]?.id;
    if (firstSection) {
      setActiveSection(firstSection, { focusTab: true });
    }
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    const lastSection = SETTINGS_SECTION_ITEMS[SETTINGS_SECTION_ITEMS.length - 1]?.id;
    if (lastSection) {
      setActiveSection(lastSection, { focusTab: true });
    }
  }
}
</script>

<template>
  <SectionGrid grid-token="sidebar" extra-class="items-start">
    <aside class="w-full shrink-0 lg:sticky lg:top-24 lg:w-72">
      <nav class="card card-border bg-base-100 shadow-sm" :aria-label="t('settings.title')">
        <div class="card-body gap-4 p-4">
          <SettingsPanelHeader :title="t('settings.title')" :description="t('settings.subtitle')">
            <template #meta>
              <span class="badge badge-neutral badge-sm" aria-hidden="true">
                {{ String(SETTINGS_SECTION_COUNT).padStart(2, "0") }}
              </span>
            </template>
          </SettingsPanelHeader>

          <div class="rounded-box border border-base-300 bg-base-200/60 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              {{ t(activeSectionEntry.labelKey) }}
            </p>
            <p class="mt-2 text-sm leading-6 text-base-content/70">
              {{
                activeSectionEntry.descriptionKey
                  ? t(activeSectionEntry.descriptionKey)
                  : t("settings.subtitle")
              }}
            </p>
          </div>

          <ul role="tablist" aria-orientation="vertical" class="menu menu-sm gap-1 rounded-box p-0">
            <li v-for="(section, index) in SETTINGS_SECTION_ITEMS" :key="section.id">
              <button
                :id="`settings-section-control-${section.id}`"
                type="button"
                role="tab"
                class="w-full rounded-box px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                :class="
                  activeSection === section.id
                    ? 'menu-active bg-base-200 text-base-content'
                    : 'text-base-content/80 hover:bg-base-200'
                "
                :aria-selected="activeSection === section.id"
                :aria-controls="`settings-section-panel-${section.id}`"
                :tabindex="activeSection === section.id ? 0 : -1"
                @click="setActiveSection(section.id)"
                @keydown="handleSettingsSectionKeydown($event, section.id)"
              >
                <span class="flex items-start gap-3">
                  <component
                    :is="section.iconName"
                    class="mt-0.5 h-5 w-5 shrink-0"
                  />
                  <span class="min-w-0 grow">
                    <span class="flex items-center justify-between gap-3">
                      <span class="font-medium">{{ t(section.labelKey) }}</span>
                      <span class="badge badge-ghost badge-xs" aria-hidden="true">
                        {{ String(index + 1).padStart(2, "0") }}
                      </span>
                    </span>
                    <span
                      v-if="section.descriptionKey"
                      class="mt-1 block text-xs leading-5 text-base-content/60"
                    >
                      {{ t(section.descriptionKey) }}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <div class="min-w-0 flex-1">
      <div
        v-for="section in SETTINGS_SECTION_ITEMS"
        :id="`settings-section-panel-${section.id}`"
        :key="section.id"
        role="tabpanel"
        :aria-labelledby="`settings-section-control-${section.id}`"
        :aria-hidden="activeSection !== section.id"
        v-show="activeSection === section.id"
      >
        <slot :name="section.slotName" />
      </div>
    </div>
  </SectionGrid>
</template>
