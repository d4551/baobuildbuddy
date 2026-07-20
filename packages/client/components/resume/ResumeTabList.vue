<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { ref, watch } from "vue";

interface ResumeTabListProps {
  readonly tabs: readonly string[];
  readonly navigationAria: string;
  readonly tabLabel: (tab: string) => string;
  readonly tabAriaLabel: (tab: string) => string;
}

const activeTab = defineModel<string>("activeTab", { required: true });


const props = defineProps<ResumeTabListProps>();

const tabRefs = ref<(HTMLButtonElement | null)[]>([]);

function syncTabRefs(): void {
  tabRefs.value = new Array<HTMLButtonElement | null>(props.tabs.length).fill(null);
}

function setTabRef(index: number, element: Element | ComponentPublicInstance | null): void {
  tabRefs.value[index] = element instanceof HTMLButtonElement ? element : null;
}

function focusTab(index: number): void {
  tabRefs.value[index]?.focus();
}

function selectTab(tab: string): void {
  activeTab.value = tab;
}

function handleTabKeydown(event: KeyboardEvent, index: number): void {
  const lastTabIndex = props.tabs.length - 1;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextIndex = index === lastTabIndex ? 0 : index + 1;
    const nextTab = props.tabs[nextIndex];
    if (nextTab) {
      selectTab(nextTab);
    }
    focusTab(nextIndex);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const nextIndex = index === 0 ? lastTabIndex : index - 1;
    const nextTab = props.tabs[nextIndex];
    if (nextTab) {
      selectTab(nextTab);
    }
    focusTab(nextIndex);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    const firstTab = props.tabs[0];
    if (firstTab) {
      selectTab(firstTab);
    }
    focusTab(0);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    const lastTab = props.tabs[lastTabIndex];
    if (lastTab) {
      selectTab(lastTab);
    }
    focusTab(lastTabIndex);
  }
}

watch(
  () => props.tabs,
  () => {
    syncTabRefs();
  },
  { immediate: true },
);
</script>

<template>
  <nav class="tabs tabs-lift" :aria-label="navigationAria">
    <button 
      v-for="(tab, index) in tabs"
      :key="tab"
      type="button"
      class="tab"
      :class="{ 'tab-active': activeTab === tab }"
      :aria-label="tabAriaLabel(tab)"
      :aria-pressed="activeTab === tab"
      :ref="(element) => setTabRef(index, element)"
      @click="selectTab(tab)"
      @keydown="handleTabKeydown($event, index)"
    >
      {{ tabLabel(tab) }}
    </button>
  </nav>
</template>
