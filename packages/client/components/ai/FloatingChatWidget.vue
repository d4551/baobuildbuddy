<script setup lang="ts">
import { AI_CHAT_PAGE_PATH, APP_BRAND, inferAIChatDomainFromRoutePath } from "@bao/shared";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { messages, loading, streaming, sendMessage, clearMessages } = useAI();
const { t } = useI18n();

const isOpen = ref(false);
const draft = ref("");
const unreadCount = ref(0);
const panelBodyRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const chatPanelId = "floating-chat-panel";
const currentContextLabel = computed(() => {
  const domain = inferAIChatDomainFromRoutePath(route.path);
  if (domain === "resume") return t("floatingChat.contextDomain.resume");
  if (domain === "job_search") return t("floatingChat.contextDomain.jobSearch");
  if (domain === "interview") return t("floatingChat.contextDomain.interview");
  if (domain === "portfolio") return t("floatingChat.contextDomain.portfolio");
  if (domain === "skills") return t("floatingChat.contextDomain.skills");
  if (domain === "automation") return t("floatingChat.contextDomain.automation");
  return t("floatingChat.contextDomain.general");
});

const showWidget = computed(() => !route.path.startsWith(AI_CHAT_PAGE_PATH));

watch(showWidget, (visible) => {
  if (!visible) {
    isOpen.value = false;
    unreadCount.value = 0;
  }
});

watch(
  () => messages.value.length,
  (nextCount, previousCount) => {
    if (isOpen.value) {
      unreadCount.value = 0;
      scrollToBottom();
      return;
    }

    if (nextCount > previousCount) {
      unreadCount.value += nextCount - previousCount;
    }
  },
);

watch(isOpen, (open) => {
  if (!open) return;
  unreadCount.value = 0;
  scrollToBottom();
  nextTick(() => {
    inputRef.value?.focus();
  });
});

function scrollToBottom() {
  nextTick(() => {
    const panelBody = panelBodyRef.value;
    if (!panelBody) return;
    panelBody.scrollTop = panelBody.scrollHeight;
  });
}

function toggleWidget() {
  isOpen.value = !isOpen.value;
}

function closeWidget() {
  isOpen.value = false;
}

function handleFocusChatShortcut() {
  isOpen.value = true;
  unreadCount.value = 0;
  nextTick(() => {
    inputRef.value?.focus();
  });
}

function onFocusChatShortcut() {
  handleFocusChatShortcut();
}

async function handleSendMessage() {
  if (!draft.value.trim() || loading.value) return;

  const content = draft.value.trim();
  draft.value = "";
  await sendMessage(content, { source: "floating-widget" });
  scrollToBottom();
}

function formatTime(date?: string): string {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(() => {
  window.addEventListener("bao:focus-chat", onFocusChatShortcut);
});

onUnmounted(() => {
  window.removeEventListener("bao:focus-chat", onFocusChatShortcut);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showWidget"
      class="fixed z-[60] bottom-24 right-4 lg:bottom-6 lg:right-6 flex flex-col items-end gap-3"
    >
      <div
        v-if="isOpen"
        :id="chatPanelId"
        class="card border border-base-300 bg-base-100 shadow-xl w-[min(24rem,calc(100vw-2rem))] h-[28rem]"
      >
        <div class="card-body p-0 h-full">
          <header class="flex items-center justify-between p-3 border-b border-base-300">
            <div>
              <h2 class="font-semibold text-sm">{{ APP_BRAND.assistantName }}</h2>
              <div class="mt-1 flex items-center gap-2">
                <p class="text-xs text-base-content/60">{{ t("floatingChat.subtitle") }}</p>
                <span
                  class="badge badge-soft badge-info badge-xs"
                  :aria-label="t('floatingChat.contextAria', { context: currentContextLabel })"
                >
                  {{ t("floatingChat.contextBadge", { context: currentContextLabel }) }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <NuxtLink
                :to="AI_CHAT_PAGE_PATH"
                class="btn btn-ghost btn-xs"
                :aria-label="t('floatingChat.expandAria')"
              >
                {{ t("floatingChat.expandButton") }}
              </NuxtLink>
              <button
                class="btn btn-ghost btn-xs"
                :aria-label="t('floatingChat.clearAria')"
                @click="clearMessages"
              >
                {{ t("floatingChat.clearButton") }}
              </button>
              <button class="btn btn-ghost btn-xs" :aria-label="t('floatingChat.closeAria')" @click="closeWidget">
                ✕
              </button>
            </div>
          </header>

          <div
            ref="panelBodyRef"
            class="flex-1 overflow-y-auto p-3 space-y-3"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            :aria-label="t('floatingChat.logAria')"
          >
            <div
              v-for="(message, index) in messages"
              :key="`${message.timestamp}-${index}`"
              class="chat"
              :class="message.role === 'user' ? 'chat-end' : 'chat-start'"
            >
              <div class="chat-header text-[11px] opacity-60 mb-1">
                {{ message.role === 'user' ? t("floatingChat.youLabel") : APP_BRAND.assistantName }}
                <time class="ml-1">{{ formatTime(message.timestamp) }}</time>
              </div>
              <div class="chat-bubble text-sm" :class="message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'">
                {{ message.content }}
              </div>
            </div>

            <div v-if="streaming" class="chat chat-start">
              <div class="chat-bubble chat-bubble-secondary">
                <span class="loading loading-dots loading-sm"></span>
              </div>
            </div>
          </div>

          <div class="p-3 border-t border-base-300">
            <div class="join w-full">
              <input
                ref="inputRef"
                v-model="draft"
                class="input input-bordered join-item w-full"
                type="text"
                :placeholder="t('floatingChat.inputPlaceholder')"
                :aria-label="t('floatingChat.inputAria')"
                :disabled="loading"
                @keyup.enter="handleSendMessage"
              />
              <button
                class="btn btn-primary join-item"
                :aria-label="t('floatingChat.sendAria')"
                :disabled="!draft.trim() || loading"
                @click="handleSendMessage"
              >
                <span v-if="loading" class="loading loading-spinner loading-xs"></span>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <button
          class="btn btn-primary btn-circle shadow-lg"
          :aria-label="isOpen ? t('floatingChat.hideAria') : t('floatingChat.showAria')"
          :aria-expanded="isOpen"
          :aria-controls="chatPanelId"
          @click="toggleWidget"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
          </svg>
        </button>

        <span
          v-if="unreadCount > 0 && !isOpen"
          class="badge badge-error badge-sm absolute -top-1 -right-1"
          :aria-label="t('floatingChat.unreadAria', { count: unreadCount })"
        >
          {{ unreadCount }}
        </span>
      </div>
    </div>
  </Teleport>
</template>
