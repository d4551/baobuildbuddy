const aiChatPage = {
  aiChatPage: {
    title: "{brand}とチャットする",
    seoTitle: "{brand} AIチャット",
    seoDescription:
      "履歴書戦略、面接準備、自動化計画についてAIキャリアコパイロットと会話できます。",
    subtitle: "ゲーム業界向けのAIキャリアアシスタント",
    clearAria: "チャット履歴をクリア",
    clearButton: "クリア",
    logAria: "AIチャット会話",
    youLabel: "あなた",
    inputPlaceholder: "ゲーム業界でのキャリアについて質問してください",
    inputAria: "チャットメッセージ",
    sendAria: "チャットメッセージを送信",
    voiceSettings: {
      legend: "音声モデル設定",
      sttProviderLabel: "音声認識プロバイダ",
      sttProviderAria: "音声認識プロバイダの選択",
      sttModelLabel: "音声認識モデル",
      sttModelAria: "音声認識モデルの選択",
      ttsProviderLabel: "音声合成プロバイダ",
      ttsProviderAria: "音声合成プロバイダの選択",
      ttsModelLabel: "音声合成モデル",
      ttsModelAria: "音声合成モデルの選択",
      hint: "これらのプロバイダ/モデル設定はチャットと自動化の音声フローで保存されます。",
      saveButton: "音声設定を保存",
      saveAria: "音声のプロバイダとモデル設定を保存",
      saveSuccess: "音声設定を保存しました",
      saveErrorFallback: "音声設定の保存に失敗しました",
      unsavedHint: "音声プロフィールに保存されていない変更があります。",
      providers: {
        browser: "ブラウザ（オンデバイス）",
        local: "ローカル",
        custom: "カスタム",
      },
      onDeviceHint:
        "ブラウザ（オンデバイス）は端末の Web Speech API を使います。音声は端末外に出ません。",
    },
  },
} as const;

export default aiChatPage;
