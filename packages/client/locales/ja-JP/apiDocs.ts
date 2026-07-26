const apiDocs = {
  apiDocs: {
    seoTitle: "APIドキュメント",
    seoDescription:
      "利用可能なエンドポイントを確認し、アプリから直接エンドポイントのリクエストをテストできます。",
    title: "APIリファレンス",
    intro: "APIの公開範囲を確認し、統合テスターでエンドポイントチェックを実行します。",
    endpointNavigator: "エンドポイント一覧",
    groups: {
      untagged: "未分類",
    },
    state: {
      loading: "API仕様を読み込み中",
      errorRetryable: "一時的にサービスを利用できません。再試行してください。",
      errorNonRetryable: "APIドキュメントを読み込めませんでした。",
      unauthorized: "APIドキュメントを表示する権限がありません。",
      empty: "APIエンドポイントが見つかりません。",
    },
    actions: {
      retry: "再試行",
    },
    a11y: {
      endpointNavigation: "エンドポイントナビゲーション",
    },
    endpoint: {
      noDescription: "説明はありません。",
      methodLabel: "メソッド",
      operationIdLabel: "オペレーションID",
      openTester: "テスターを開く",
      navigateAria: "{method} {path} に移動",
      openTesterAria: "{method} {path} のテスターを開く",
    },
    tester: {
      title: "エンドポイントテスター",
      lifecycleTitle: "リクエストのライフサイクル",
      pathParametersIntro: "パスパラメータ",
      queryParametersIntro: "クエリパラメータ",
      requestBodyIntro: "リクエストボディ",
      requestBodyAria: "JSON リクエストボディ",
      bodyPlaceholder: '{\n  "サンプル": "値"\n}',
      noRequestBodyTemplate: "OpenAPI仕様にリクエストボディテンプレートがありません。",
      parameterLabel: "パラメータ {name}",
      send: "リクエストを送信",
      close: "閉じる",
      closeAria: "エンドポイントテスターを閉じる",
      responseTitle: "レスポンス",
      responseStatusLabel: "ステータス {status}: {text}",
      durationLabel: "所要時間 {duration} ms",
      errorFallback: "詳細なエラー情報なしでリクエストが失敗しました。",
      invalidPath: "すべてのパスパラメータを入力してください。",
      requestFailure: "リクエストを実行できませんでした。",
      requestErrorToast: "リクエストに失敗しました",
      emptyResponseToast: "レスポンスボディなしでリクエストが完了しました",
      requestSuccessToast: "リクエストが正常に完了しました",
      emptyResponse: "レスポンスに本文がありません。",
      requestMethodLabel: "メソッド",
      requestUrlLabel: "リクエスト先URL",
      steps: {
        configure: "設定",
        send: "送信",
        response: "レスポンス確認",
      },
      metadataTitle: "レスポンスメタデータ",
      metadata: {
        columns: {
          label: "ラベル",
          value: "値",
        },
        responseStatus: "ステータス",
        duration: "所要時間",
      },
      responseHeadersLabel: "レスポンスヘッダー",
      noResponseHeaders: "レスポンスヘッダーがありません。",
    },
  },
} as const;

export default apiDocs;
