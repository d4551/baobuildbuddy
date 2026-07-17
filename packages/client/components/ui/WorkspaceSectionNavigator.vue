<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AppIconName } from "~/components/icons/icon-registry";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";

interface WorkspaceSectionItem {
  readonly id: string;
  readonly labelKey: string;
  readonly descriptionKey?: string;
  readonly iconName: AppIconName;
}

const props = withDefaults(
  defineProps<{
    sections: readonly WorkspaceSectionItem[];
    activeSection: string;
    ariaLabelKey: string;
    buildRoute: (sectionId: string) => string;
    badgeById?: Readonly<Record<string, number | string>>;
    fallbackDescriptionKey?: string;
  }>(),
  {
    badgeById: () => ({}),
    fallbackDescriptionKey: undefined,
  },
);

const { t } = useI18n();

const activeSectionEntry = computed<WorkspaceSectionItem | null>(() => {
  const matchedSection = props.sections.find((section) => section.id === props.activeSection);
  return matchedSection ?? props.sections[0] ?? null;
});

const activeDescription = computed<string>(() => {
  if (activeSectionEntry.value?.descriptionKey) {
    return t(activeSectionEntry.value.descriptionKey);
  }

  if (props.fallbackDescriptionKey) {
    return t(props.fallbackDescriptionKey);
  }

  return "";
});
</script>

<template>
  <div class="space-y-6">
    <section class="card card-border card-glass min-w-0 max-w-full overflow-x-clip" :aria-label="t(ariaLabelKey)">
      <div class="card-body min-w-0 max-w-full gap-4 overflow-x-clip p-4 lg:p-5">
        <div
          v-if="activeSectionEntry"
          class="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="tooltip tooltip-right shrink-0"
              :data-tip="activeDescription || t(activeSectionEntry.labelKey)"
            >
              <span
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-sm"
              >
                <component
                  :is="resolveAppIconComponent(activeSectionEntry.iconName)"
                  class="h-5 w-5"
                  aria-hidden="true"
                />
              </span>
            </span>

            <div class="min-w-0 space-y-1">
              <h2 class="text-lg font-semibold text-base-content">
                {{ t(activeSectionEntry.labelKey) }}
              </h2>
              <p
                v-if="activeDescription"
                class="max-w-3xl text-sm leading-6 text-base-content/70"
              >
                {{ activeDescription }}
              </p>
            </div>
          </div>

          <nav
            class="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain xl:max-w-4xl"
            :aria-label="t(ariaLabelKey)"
          >
            <div class="tabs tabs-box w-max min-w-full gap-2 bg-base-200/70 p-2 xl:min-w-0">
              <NuxtLink
                v-for="section in sections"
                :key="section.id"
                :to="buildRoute(section.id)"
                class="tab h-auto min-h-0 grow justify-start gap-3 rounded-box px-3 py-2 text-left xl:grow-0"
                :class="activeSection === section.id ? 'tab-active' : ''"
                :aria-current="activeSection === section.id ? 'page' : undefined"
              >
                <span
                  class="tooltip tooltip-bottom shrink-0"
                  :data-tip="section.descriptionKey ? t(section.descriptionKey) : t(section.labelKey)"
                >
                  <span
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm"
                    :class="
                      activeSection === section.id
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-base-300 bg-base-100 text-base-content/60'
                    "
                  >
                    <component
                      :is="resolveAppIconComponent(section.iconName)"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                  </span>
                </span>

                <span class="min-w-0 font-medium">{{ t(section.labelKey) }}</span>

                <span
                  v-if="badgeById[section.id] !== undefined"
                  class="badge badge-ghost badge-xs"
                  aria-hidden="true"
                >
                  {{ badgeById[section.id] }}
                </span>
              </NuxtLink>
            </div>
          </nav>
        </div>
      </div>
    </section>

    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
