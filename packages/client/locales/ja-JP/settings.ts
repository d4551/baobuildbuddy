const catalog = {
  settings: {
    seoTitle: "設定とプロフィール",
    seoDescription: "プロフィール、AIプロバイダー、通知設定、自動化の既定値を一元的に管理します。",
    title: "設定とプロフィール",
    subtitle: "アイデンティティ、アシスタントの動作、自動化のデフォルト設定を一元管理します。",
    profile: {
      title: "ユーザープロフィール",
      nameLegend: "名前",
      emailLegend: "メール",
      currentRoleLegend: "現在の役職",
      currentCompanyLegend: "現在の会社",
      locationLegend: "所在地",
      yearsExperienceLegend: "経験年数",
      githubLegend: "GitHubプロフィール",
      linkedinLegend: "LinkedInプロフィール",
      summaryLegend: "概要",
      technicalSkillsLegend: "技術スキル（カンマ区切り）",
      softSkillsLegend: "ソフトスキル（カンマ区切り）",
      saveButton: "プロフィールを保存",
    },
    preferences: {
      title: "環境設定",
      themeLabel: "テーマ",
      lightTheme: "ライト",
      darkTheme: "ダーク",
      languageLegend: "言語",
      notificationsLegend: "通知",
      saveButton: "設定を保存",
    },
    automation: {
      title: "自動化",
      subtitle: "RPAスクリプトの動作とデフォルトブラウザを設定します。",
      headlessTitle: "ヘッドレスモード",
      headlessDescription: "UIなしでブラウザを実行します。",
      smartSelectorsTitle: "スマートセレクター",
      smartSelectorsDescription: "AIでフォームフィールドを検出します。",
      autoScreenshotsTitle: "自動スクリーンショット",
      autoScreenshotsDescription: "各ステップでスクリーンショットを保存します。",
      timeoutLegend: "タイムアウト（秒）",
      retentionLegend: "スクリーンショット保持（日数）",
      concurrentRunsLegend: "最大同時実行数",
      defaultBrowserLegend: "デフォルトブラウザ",
      saveButton: "自動化設定を保存",
    },
    aiProviders: {
      title: "AIプロバイダー",
      subtitle:
        "ローカルプロバイダーを優先し、クラウドプロバイダーをフォールバックとして使用します。",
      openaiCompatTitle: "OpenAI 互換 API",
      openaiCompatDescription:
        "OpenAI SDK の baseURL にこの URL を指定し、Bao API キーを Bearer として使います（models + chat/completions）。",
      openaiCompatAria: "OpenAI 互換 API のベース URL",
      configuredBadge: "設定済み",
      endpointLabel: "エンドポイントURL",
      credentialLabel: "APIキー",
      testButton: "テスト",
      localModelLegend: "ローカルモデル名",
      connectedBadge: "接続済み",
      failedBadge: "失敗",
      saveButton: "APIキーを保存",
      connectionSuccessful: "接続成功",
      connectionFailed: "接続失敗",
      preferredProviderLegend: "優先AIプロバイダー",
      preferredProviderAria: "優先するAIプロバイダーを選択",
      preferredProviderSaveButton: "チャット既定を保存",
      preferredProviderHint:
        "このクイック設定は、チャットや会話系フローの既定プロバイダーを決めます。",
      readinessTitle: "プロバイダーの準備状況",
      readinessDescription: "各ワークフローへ割り当てる前に、設定状況と接続性を確認します。",
      preferredProviderSaved: "優先プロバイダーが更新されました",
      routingTitle: "用途別ルーティング",
      routingSubtitle:
        "チャット、面接、エクスポート、自動化ごとにプロバイダーと任意のモデルを割り当て、1つのグローバル既定値に依存しないようにします。",
      routingCoverageTitle: "ルーティング対象フロー",
      routingCoverageDescription:
        "各 AI 機能ごとに、独自のプロバイダーと任意のモデル上書きを持てます。",
      saveRoutingAria: "用途別のAIルーティングを保存",
      saveRoutingButton: "ルーティングを保存",
      routingSaved: "AIルーティングを保存しました",
      purposeColumnLabel: "用途",
      purposeProviderLegend: "プロバイダー",
      purposeProviderAria: "{purpose} 用のプロバイダーを選択",
      purposeModelLegend: "モデル上書き",
      purposeModelAria: "{purpose} 用のモデル上書きを設定",
      purposeModelPlaceholder: "空欄のままにするとプロバイダー既定値または自動検出を使います",
      purposeModelHint:
        "このワークフローで特定モデルが必要な場合だけ指定してください。空欄ならプロバイダー既定値を使います。",
      purposes: {
        chat: {
          label: "チャット",
          description: "一般チャット、アシスタント応答、会話型のやり取り。",
        },
        interviewQuestions: {
          label: "面接質問",
          description: "質問生成、深掘り、会話型面接の進行制御。",
        },
        interviewFeedback: {
          label: "面接フィードバック",
          description: "回答採点、ルーブリック評価、最終サマリー生成。",
        },
        resume: {
          label: "履歴書",
          description: "履歴書の生成、改善、採点、構造化CV出力。",
        },
        coverLetter: {
          label: "カバーレター",
          description: "カバーレターの作成、推敲、書き出し向け表現調整。",
        },
        emailResponse: {
          label: "メール返信",
          description: "採用担当への返信文案と自動返信メール生成。",
        },
        jobMatch: {
          label: "求人適合度",
          description: "求人マッチ度の採点、役割分析、推薦サマリー。",
        },
        scrapeEnrichment: {
          label: "スクレイプ拡張",
          description: "スタジオペルソナの補完とスクレイプ後の採用シグナル分析。",
        },
        automationFieldMapping: {
          label: "自動化フィールドマッピング",
          description: "フィールド対応付け、セレクター推定、構造化フォーム自動化。",
        },
      },
      ollamaTipTitle: "補足: Ollama はこのアプリの外で導入します",
      ollamaTipDescription:
        "先にインストールし、あなた自身のマシンやプロジェクト向けの Ollama 公式セットアップに従ってください:",
      ollamaTipLinkAria: "Ollama のサイトを新しいタブで開く",
      credentialsDescription:
        "実運用フローに割り当てる予定のあるプロバイダーだけ、認証情報を保存して接続確認してください。",
    },
    brand: {
      title: "ブランドコントロールプレーン",
      subtitle:
        "ホワイトラベルのアイデンティティ、タイポグラフィ、意味論的テーマトークン、ローカライズ済みコピーを1つの永続設定から管理します。",
      infoTitle: "すべてのブランド面を1つの契約で管理",
      infoDescription:
        "変更を製品全体へ反映する前に、アイデンティティ、タイポグラフィ、テーマトークン、ローカライズ済みコピーをプレビューできます。",
      previewEyebrow: "ライブプレビュー",
      previewTitle: "ブランド面のプレビュー",
      previewSubtitle:
        "次のバリアントを保存する前に、ロゴ、トーン、トークンのコントラスト、コピーのオーバーライドを確認します。",
      previewLogoAlt: "{brand} のロゴプレビュー",
      previewPrimaryAction: "ワークスペースを開く",
      previewSecondaryAction: "コピーを確認",
      editorTabsAria: "ブランド編集セクション",
      assetPathHint:
        "クライアントが直接読み込める公開アセットパス、または絶対URLを使用してください。",
      fontStylesheetHint:
        "下の `font-family` スタックを適用する前に、使用するフォントのホスト済みスタイルシートを読み込んでください。",
      tabs: {
        identity: "アイデンティティ",
        identityDescription:
          "アクティブなブランドパッケージの名称、アシスタントのトーン、ロゴ資産を調整します。",
        typography: "タイポグラフィ",
        typographyDescription:
          "インターフェース全体で使うホスト済みスタイルシートと display、body、mono の各スタックを設定します。",
        themes: "テーマトークン",
        themesDescription:
          "意味論的な色、半径、境界線、奥行きを定義する明暗の daisyUI トークンオブジェクトを編集します。",
        content: "コンテンツ",
        contentDescription:
          "ソースカタログを触らずに、既定の SEO コピーと実行時のロケールオーバーライドを調整します。",
      },
      stats: {
        product: "製品",
        productDescription: "顧客向けに表示される主要なアプリケーション名です。",
        assistant: "アシスタント",
        assistantDescription: "チャット画面全体で既定表示されるアシスタントの人格です。",
        locales: "言語",
        localesDescription: "設定画面で公開されている対応インターフェース言語数です。",
        overrides: "オーバーライド",
        overridesDescription: "アクティブなロケールカタログへ統合されるカスタムコピーキー数です。",
      },
    },
    toasts: {
      apiKeysSaved: "APIキーが保存されました",
      themeSaved: "テーマが保存されました",
      preferencesSaved: "設定が保存されました",
      profileSaved: "プロフィールが保存されました",
      automationSaved: "自動化設定が保存されました",
    },
  },
} as const;

export default catalog;
