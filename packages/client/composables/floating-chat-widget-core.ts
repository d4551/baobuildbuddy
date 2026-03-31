import type { ChatMessage } from "@bao/shared/types/ai";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

export const createFloatingChatWidgetState = () => ({
  isOpen: ref(false),
  isSpeechSettingsOpen: ref(false),
  draft: ref(""),
  unreadCount: ref(0),
  panelBodyRef: useTemplateRef<HTMLElement>("floatingChatPanelBody"),
  inputRef: useTemplateRef<HTMLTextAreaElement>("floatingChatInput"),
  shouldStickToBottom: ref(true),
});

export const createFloatingChatWidgetCoreState = () => {
  const route = useRoute();
  const ai = useAI();
  const { $toast } = useNuxtApp();
  const { t, locale } = useI18n();
  const { resolvedBrand } = useBrand();
  const uiState = createFloatingChatWidgetState();
  const typedMessages = computed<ChatMessage[]>(() => [...ai.messages.value]);
  const speechProfiles = useSpeechModelProfiles({ locale });
  const voice = useChatVoice({
    draft: uiState.draft,
    locale,
    messages: typedMessages,
  });

  return {
    route,
    ai,
    toast: $toast,
    t,
    locale,
    resolvedBrand,
    uiState,
    speechProfiles,
    voice,
  };
};
