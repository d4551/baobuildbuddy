import type {
  createFloatingChatWidgetMessageActions,
  createFloatingChatWidgetPanelActions,
  createFloatingChatWidgetSpeechActions,
} from "./floating-chat-widget-actions";
import type { createFloatingChatWidgetCoreState } from "./floating-chat-widget-core";
import type { createFloatingChatWidgetDerivedState } from "./floating-chat-widget-derived";

export type FloatingChatWidgetState = ReturnType<typeof createFloatingChatWidgetCoreState> & {
  derivedState: ReturnType<typeof createFloatingChatWidgetDerivedState>;
  panelActions: ReturnType<typeof createFloatingChatWidgetPanelActions>;
  messageActions: ReturnType<typeof createFloatingChatWidgetMessageActions>;
  speechActions: ReturnType<typeof createFloatingChatWidgetSpeechActions>;
  scrollToBottom: (force?: boolean) => void;
  handlePanelScroll: () => void;
};
