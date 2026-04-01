import type { Ref } from "vue";
import type { useI18n } from "vue-i18n";
import { settlePromise } from "./async-flow";
import type { useSpeechModelProfiles } from "./useSpeechModelProfiles";
import { getErrorMessage } from "~/utils/errors";

export const createFloatingChatWidgetPanelActions = (options: {
  isOpen: Ref<boolean>;
  isSpeechSettingsOpen: Ref<boolean>;
  unreadCount: Ref<number>;
  inputRef: ReturnType<typeof useTemplateRef<HTMLTextAreaElement>>;
  ensureSpeechConfigLoaded: ReturnType<typeof useSpeechModelProfiles>["ensureSpeechConfigLoaded"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  t: ReturnType<typeof useI18n>["t"];
}) => {
  const toggleWidget = () => {
    options.isOpen.value = !options.isOpen.value;
  };

  const closeWidget = () => {
    options.isOpen.value = false;
  };

  const toggleSpeechSettings = async (): Promise<void> => {
    if (options.isSpeechSettingsOpen.value) {
      options.isSpeechSettingsOpen.value = false;
      return;
    }

    const loadSpeechConfigResult = await settlePromise(
      options.ensureSpeechConfigLoaded(),
      options.t("apiErrors.settings.fetchFailed"),
    );
    if (!loadSpeechConfigResult.ok) {
      options.toast.error(
        getErrorMessage(loadSpeechConfigResult.error, options.t("apiErrors.settings.fetchFailed")),
      );
      return;
    }

    options.isSpeechSettingsOpen.value = true;
  };

  const handleFocusChatShortcut = () => {
    options.isOpen.value = true;
    options.unreadCount.value = 0;
    requestAnimationFrame(() => {
      options.inputRef.value?.focus();
    });
  };

  return {
    toggleWidget,
    closeWidget,
    toggleSpeechSettings,
    handleFocusChatShortcut,
  };
};

export const createFloatingChatWidgetMessageActions = (options: {
  draft: Ref<string>;
  loading: ReturnType<typeof useAI>["loading"];
  isVoiceListening: Readonly<Ref<boolean>>;
  stopListening: () => void;
  shouldStickToBottom: Ref<boolean>;
  sendMessage: ReturnType<typeof useAI>["sendMessage"];
  inputRef: ReturnType<typeof useTemplateRef<HTMLTextAreaElement>>;
  scrollToBottom: (force?: boolean) => void;
}) => {
  const handleSendMessage = async () => {
    if (!options.draft.value.trim() || options.loading.value) return;

    if (options.isVoiceListening.value) {
      options.stopListening();
    }

    options.shouldStickToBottom.value = true;
    const content = options.draft.value.trim();
    options.draft.value = "";
    await options.sendMessage(content, { source: "floating-widget" });
    options.scrollToBottom(true);
  };

  const handlePromptInput = (prompt: string): void => {
    options.draft.value = prompt;
    requestAnimationFrame(() => {
      options.inputRef.value?.focus();
    });
  };

  const handleDraftKeydown = async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    await handleSendMessage();
  };

  return {
    handleSendMessage,
    handlePromptInput,
    handleDraftKeydown,
  };
};

export const createFloatingChatWidgetSpeechActions = (options: {
  saveSpeechConfig: ReturnType<typeof useSpeechModelProfiles>["saveSpeechConfig"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  t: ReturnType<typeof useI18n>["t"];
}) => {
  const handleSaveSpeechConfig = async (): Promise<void> => {
    const saveSpeechResult = await options.saveSpeechConfig(
      options.t("floatingChat.voiceSettings.saveErrorFallback"),
    );
    if (!saveSpeechResult.ok) {
      options.toast.error(
        getErrorMessage(
          saveSpeechResult.error,
          options.t("floatingChat.voiceSettings.saveErrorFallback"),
        ),
      );
      return;
    }

    if (!saveSpeechResult.saved) {
      return;
    }

    options.toast.success(options.t("floatingChat.voiceSettings.saveSuccess"));
  };

  return {
    handleSaveSpeechConfig,
  };
};
