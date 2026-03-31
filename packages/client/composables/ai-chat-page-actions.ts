import { getErrorMessage } from "~/utils/errors";

type AIChatTranslate = (key: string, params?: Record<string, unknown>) => string;

export const createAIChatPageActions = (input: {
  readonly input: Ref<string>;
  readonly loading: Readonly<Ref<boolean>>;
  readonly isVoiceListening: Readonly<Ref<boolean>>;
  readonly stopListening: () => void;
  readonly sendMessage: ReturnType<typeof useAI>["sendMessage"];
  readonly scrollToBottom: (force?: boolean) => void;
  readonly focusComposer: () => void;
  readonly shouldStickToBottom: Ref<boolean>;
  readonly saveSpeechConfig: ReturnType<typeof useSpeechModelProfiles>["saveSpeechConfig"];
  readonly toast: ReturnType<typeof useNuxtApp>["$toast"];
  readonly t: AIChatTranslate;
}) => {
  const handlePromptSelection = (prompt: string): void => {
    input.input.value = prompt;
    input.focusComposer();
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!input.input.value.trim() || input.loading.value) return;

    if (input.isVoiceListening.value) {
      input.stopListening();
    }

    input.shouldStickToBottom.value = true;
    const content = input.input.value.trim();
    input.input.value = "";
    await input.sendMessage(content, { source: "chat-page" });
    input.scrollToBottom(true);
  };

  const handleComposerKeydown = async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    await handleSendMessage();
  };

  const handleSaveSpeechConfig = async (): Promise<void> => {
    const saveSpeechResult = await input.saveSpeechConfig(
      input.t("aiChatPage.voiceSettings.saveErrorFallback"),
    );
    if (!saveSpeechResult.ok) {
      input.toast.error(
        getErrorMessage(
          saveSpeechResult.error,
          input.t("aiChatPage.voiceSettings.saveErrorFallback"),
        ),
      );
      return;
    }

    if (!saveSpeechResult.saved) {
      return;
    }

    input.toast.success(input.t("aiChatPage.voiceSettings.saveSuccess"));
  };

  return {
    handlePromptSelection,
    handleSendMessage,
    handleComposerKeydown,
    handleSaveSpeechConfig,
  };
};
