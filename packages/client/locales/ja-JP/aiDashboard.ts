const aiDashboard = {
  aiDashboard: {
    title: "AIダッシュボード",
    subtitle:
      "プロバイダーの準備状況を管理し、接続をテストし、希望するモデルを一元的なコントロール画面で設定します。",
    stats: {
      totalRequestsTitle: "総リクエスト数",
      totalRequestsDesc: "AIサービス経由で送信されたメッセージ",
      successRateTitle: "成功率",
      successRateDesc: "ユーザープロンプトに対するアシスタント応答の割合",
      averageResponseTitle: "平均応答時間",
      averageResponseValue: "{seconds}秒",
      averageResponseDesc: "チャットリクエストで計測されたレイテンシ",
      sessionsTitle: "セッション",
      sessionsDesc: "アクティブなプロバイダー: {provider}",
    },
    preference: {
      title: "プロバイダー設定",
      description: "AIチャットと生成フローの優先プロバイダーとデフォルトモデルを選択します。",
      providerLegend: "プロバイダー",
      providerAria: "優先AIプロバイダー",
      modelLegend: "モデル",
      modelAria: "優先AIモデル",
      selectProviderOption: "プロバイダーを選択",
      selectModelOption: "モデルを選択",
      providerNotConfiguredOption: "{provider}（未設定）",
      saveButton: "設定を保存",
      saveAria: "優先AIプロバイダーとモデルを保存",
      refreshButton: "更新",
      refreshAria: "AIダッシュボードデータを更新",
    },
    providerCard: {
      notConfiguredBadge: "未設定",
      testButton: "接続テスト",
      testAria: "{provider}の接続をテスト",
      configureButton: "設定",
      configureAria: "{provider}を設定するために設定を開く",
      testingLabel: "テスト中...",
    },
    availability: {
      available: "利用可能",
      unavailable: "利用不可",
    },
    health: {
      healthy: "正常",
      degraded: "低下",
      down: "停止",
      unconfigured: "未設定",
    },
    alerts: {
      noProvidersTitle: "プロバイダーが検出されません",
      noProvidersDescription:
        "チャットと生成機能を有効にするには、設定で少なくとも1つのAIプロバイダーを構成してください。",
      testSuccessTitle: "接続OK",
      testErrorTitle: "接続失敗",
    },
    tests: {
      localSuccess: "ローカルAIプロバイダーに到達できます。",
      localFailure: "ローカルAIプロバイダーに到達できません。",
      missingCredential: "このプロバイダーの認証情報はありません。",
      connectionSuccess: "接続に成功しました。",
      connectionFailure: "接続に失敗しました。",
    },
    errors: {
      usageLoadFailed: "AI利用メトリクスの読み込みに失敗しました。",
      modelsLoadFailed: "AIモデルカタログの読み込みに失敗しました。",
      preferenceSaveFailed: "AI設定の保存に失敗しました。",
    },
    toasts: {
      loadFailed: "AIダッシュボードデータの読み込みに失敗しました。",
      preferenceSaved: "AI設定を保存しました。",
      preferenceSaveFailed: "AI設定の保存に失敗しました。",
    },
  },
} as const;

export default aiDashboard;
