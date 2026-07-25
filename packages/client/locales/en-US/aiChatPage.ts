const aiChatPage = {
  aiChatPage: {
    title: "Chat with {brand}",
    seoTitle: "{brand} AI Chat",
    seoDescription:
      "Work with your hiring copilot on resume strategy, interview prep, opportunity research, and automation planning.",
    subtitle: "Your hiring copilot for game industry roles",
    clearAria: "Clear chat conversation",
    clearButton: "Clear",
    logAria: "AI chat conversation",
    youLabel: "You",
    inputPlaceholder: "Ask {assistant} anything about your game-industry career",
    inputAria: "Chat message",
    sendAria: "Send chat message",
    sendButton: "Send",
    emptyTitle: "Your assistant is ready",
    emptyCta: "Open AI dashboard",
    emptyCtaAria: "Open the AI control dashboard",
    emptyConfigureCta: "Configure AI Providers",
    emptyConfigureCtaAria: "Open Settings AI Providers to finish configuration",
    emptyConfigureTitle: "AI providers need configuration",
    emptyConfigureDescription:
      "Connect a local Ollama endpoint or cloud key before chatting. Then return here to coach, write, and research.",
    emptyDescription:
      "Use the suggested prompts or ask for coaching, writing help, opportunity research, or automation guidance.",
    composerHint: "Enter sends · Shift+Enter adds a line.",
    composerIdleStatus: "Ready when you are",
    composerBusyStatus: "Generating a response...",
    contextPanelTitle: "Current context",
    contextPanelDescription:
      "The assistant uses your active page, focused item, and recent workspace signals below.",
    promptsTitle: "Suggested prompts",
    promptsDescription:
      "Load one of these prompts into the composer with the current context already in view.",
    voiceSettings: {
      legend: "Speech Model Profiles",
      sttProviderLabel: "Speech-to-text provider",
      sttProviderAria: "Speech-to-text provider selection",
      sttModelLabel: "Speech-to-text model",
      sttModelAria: "Speech-to-text model selection",
      sttEndpointLabel: "Speech-to-text endpoint",
      sttEndpointAria: "Speech-to-text OpenAI-compatible endpoint URL",
      ttsProviderLabel: "Text-to-speech provider",
      ttsProviderAria: "Text-to-speech provider selection",
      ttsModelLabel: "Text-to-speech model",
      ttsModelAria: "Text-to-speech model selection",
      ttsEndpointLabel: "Text-to-speech endpoint",
      ttsEndpointAria: "Text-to-speech OpenAI-compatible endpoint URL",
      endpointHint: "OpenAI-compatible base URL (e.g. http://127.0.0.1:8090/v1)",
      hint: "These provider/model profiles are saved for speech workflows across chat and automation.",
      saveButton: "Save Speech Profile",
      saveAria: "Save speech provider and model preferences",
      saveSuccess: "Speech profile saved",
      saveErrorFallback: "Failed to save speech profile",
      unsavedHint: "You have unsaved speech profile changes.",
      providers: {
        browser: "Browser (Web Speech)",
        openai: "OpenAI (ignored)",
        huggingface: "Hugging Face (ignored)",
        local: "Local Kokoro (on-device)",
        custom: "Custom local",
      },
      onDeviceHint:
        "Local Kokoro runs neural TTS on this machine via OpenAI-compatible /v1/audio/speech. Browser uses Web Speech only as fallback.",
    },
  },
} as const;

export default aiChatPage;
