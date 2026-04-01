const catalog = {
  setup: {
    title: "{brand}へようこそ",
    seoTitle: "{brand} セットアップ",
    seoDescription:
      "プロフィールを設定し、AIプロバイダーを構成して、キャリアワークスペースを起動します。",
    auth: {
      setupTokenTitle: "初回セットアップ認証",
      setupTokenDescription:
        "このワークスペースの最初の API キーを発行するために、運用セットアップトークンを入力してください。",
      setupTokenLegend: "セットアップトークン",
      setupTokenPlaceholder: "セットアップトークンを入力",
      setupTokenAria: "初回 API キー発行用のセットアップトークン",
      setupTokenRequiredError:
        "最初の API キーを初期化するにはセットアップトークンを入力してください。",
      bootstrapUnavailableTitle: "セットアップトークンが未設定です",
      bootstrapUnavailableDescription:
        "このインストールで認証ブートストラップを実行する前に、運用者が BAO_AUTH_SETUP_TOKEN を設定する必要があります。",
      apiKeyLegend: "既存の API キー",
      apiKeyPlaceholder: "既存の API キーを貼り付け",
      apiKeyAria: "このワークスペースの既存 API キー",
      apiKeyRequiredError: "セットアップを完了するには既存の API キーを貼り付けてください。",
    },
    successStatusAria: "セットアップ完了ステータス",
    ollamaCommandCopyAria: "Ollama コマンドをコピー",
    ollamaCommandCopyTitle: "Ollama コマンドをコピー",
    ollamaCommandCopied: "Ollama コマンドをコピーしました",
    ollamaCommandCopyFailed: "Ollama コマンドをコピーできませんでした",
  },
} as const;

export default catalog;
