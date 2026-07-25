<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AppIconName } from "~/components/icons/icon-registry";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import {
  BADGE_GHOST_XS_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  SCROLL_PADDING_INLINE_3_CLASS,
  SCROLL_SMOOTH_CLASS,
  SCROLL_SNAP_ALIGN_START_CLASS,
  SCROLL_SNAP_X_MANDATORY_CLASS,
  SCROLL_TOUCH_PAN_X_CLASS,
  SECTION_RAIL_LABEL_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
    /**
     * When true, active section H2 is sr-only below lg — rail tabs already own the label
     * (kills Settings H1 + H2 + tab triple stack on mobile).
     */
    omitActiveHeadingBelowLg?: boolean;
  }>(),
  {
    badgeById: () => ({}),
    fallbackDescriptionKey: undefined,
    omitActiveHeadingBelowLg: false,
  },
);

const { t } = useI18n();

const sectionRailRef = ref<HTMLElement | null>(null);

const activeSectionEntry = computed<WorkspaceSectionItem | null>(() => {
  const matchedSection = props.sections.find((section) => section.id === props.activeSection);
  return matchedSection ?? props.sections[0] ?? null;
});

const scrollActiveSectionIntoView = (): void => {
  const activeLink = sectionRailRef.value?.querySelector<HTMLElement>('[aria-current="page"]');
  activeLink?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center",
  });
};

onMounted(() => {
  scrollActiveSectionIntoView();
});

watch(
  () => props.activeSection,
  async () => {
    await nextTick();
    scrollActiveSectionIntoView();
  },
);

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
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <!-- No overflow-x-clip here: section rail must scroll horizontally @320. -->
    <section class="card card-border card-glass" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]" :aria-label="t(ariaLabelKey)">
      <div class="card-body lg:p-5" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
        <div
          v-if="activeSectionEntry"
          class="flex flex-col" :class="[TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap4]"
        >
          <div class="flex items-start" :class="[TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap3]">
            <span
              class="tooltip tooltip-right shrink-0"
              :data-tip="activeDescription || t(activeSectionEntry.labelKey)"
            >
              <span
                class="inline-flex h-10 w-10 items-center justify-center border border-primary/30 bg-primary/10 text-primary" :class="[SHADOW_TOKEN_CLASS.sm, RADIUS_TOKEN_CLASS.full]"
              >
                <component
                  :is="resolveAppIconComponent(activeSectionEntry.iconName)"
                  class="h-5 w-5"
                  aria-hidden="true"
                />
              </span>
            </span>

            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1, TRUNCATE_FLEX_CHILD_CLASS]">
              <h2
                class="font-semibold text-base-content"
                :class="[
                  TYPOGRAPHY_SCALE_CLASS.lg,
                  omitActiveHeadingBelowLg ? 'max-lg:sr-only' : '',
                ]"
              >
                {{ t(activeSectionEntry.labelKey) }}
              </h2>
              <p
                v-if="activeDescription"
                class="max-w-3xl leading-6 text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
              >
                {{ activeDescription }}
              </p>
            </div>
          </div>

          <nav
            ref="sectionRailRef"
            class="overscroll-x-contain max-lg:overflow-x-auto lg:overflow-x-visible"
            :class="[
              FLUID_WIDTH_CLASS,
              TRUNCATE_FLEX_CHILD_CLASS,
              SCROLL_SNAP_X_MANDATORY_CLASS,
              SCROLL_TOUCH_PAN_X_CLASS,
              SCROLL_SMOOTH_CLASS,
              SCROLL_PADDING_INLINE_3_CLASS,
            ]"
            data-testid="workspace-section-rail"
            :aria-label="t(ariaLabelKey)"
          >
            <div
              class="tabs tabs-box max-w-none p-2 max-lg:w-max lg:flex lg:w-full lg:flex-wrap"
              :class="[SURFACE_GLASS_SUBTLE_CLASS, FLEX_GAP_TOKEN_CLASS.gap2]"
            >
              <NuxtLink
                v-for="section in sections"
                :key="section.id"
                :to="buildRoute(section.id)"
                class="tab h-auto shrink-0 justify-start whitespace-nowrap rounded-box px-3 py-2 text-start"
                active-class=""
                exact-active-class=""
                :class="[
                  TOUCH_TARGET_MIN_CLASS,
                  FLEX_GAP_TOKEN_CLASS.gap3,
                  SCROLL_SNAP_ALIGN_START_CLASS,
                  activeSection === section.id ? 'tab-active' : '',
                ]"
                :aria-current="activeSection === section.id ? 'page' : undefined"
                :aria-label="t(section.labelKey)"
              >
                <span
                  class="tooltip tooltip-bottom shrink-0"
                  :data-tip="section.descriptionKey ? t(section.descriptionKey) : t(section.labelKey)"
                >
                  <span
                    class="inline-flex h-8 w-8 items-center justify-center border" :class="[SHADOW_TOKEN_CLASS.sm, RADIUS_TOKEN_CLASS.full, activeSection === section.id
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-base-300 bg-base-100 text-muted']"
                  >
                    <component
                      :is="resolveAppIconComponent(section.iconName)"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                  </span>
                </span>

                <span :class="[SECTION_RAIL_LABEL_CLASS]">{{ t(section.labelKey) }}</span>

                <span
                  v-if="badgeById[section.id] !== undefined"
                  :class="[BADGE_GHOST_XS_CLASS, 'shrink-0']"
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

    <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
      <slot />
    </div>
  </div>
</template>
