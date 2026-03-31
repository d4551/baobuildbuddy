import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createFloatingChatWidgetPanelActions } from "./floating-chat-widget-actions";

const toast = {
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};
const t = (key: string) => key;
const inputRef = ref<HTMLTextAreaElement | null>(null);

describe("createFloatingChatWidgetPanelActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads speech settings only when opening the speech settings panel", async () => {
    const isOpen = ref(false);
    const isSpeechSettingsOpen = ref(false);
    const unreadCount = ref(0);
    const ensureSpeechConfigLoaded = vi.fn(() => Promise.resolve());

    const panelActions = createFloatingChatWidgetPanelActions({
      isOpen,
      isSpeechSettingsOpen,
      unreadCount,
      inputRef,
      ensureSpeechConfigLoaded,
      toast,
      t,
    });

    await panelActions.toggleSpeechSettings();
    expect(ensureSpeechConfigLoaded).toHaveBeenCalledTimes(1);
    expect(isSpeechSettingsOpen.value).toBe(true);

    await panelActions.toggleSpeechSettings();
    expect(ensureSpeechConfigLoaded).toHaveBeenCalledTimes(1);
    expect(isSpeechSettingsOpen.value).toBe(false);
  });

  it("keeps the speech settings panel closed and reports an error when loading fails", async () => {
    const isOpen = ref(false);
    const isSpeechSettingsOpen = ref(false);
    const unreadCount = ref(0);
    const ensureSpeechConfigLoaded = vi.fn(() => Promise.reject(new Error("settings unavailable")));

    const panelActions = createFloatingChatWidgetPanelActions({
      isOpen,
      isSpeechSettingsOpen,
      unreadCount,
      inputRef,
      ensureSpeechConfigLoaded,
      toast,
      t,
    });

    await panelActions.toggleSpeechSettings();

    expect(isSpeechSettingsOpen.value).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("settings unavailable");
  });
});
