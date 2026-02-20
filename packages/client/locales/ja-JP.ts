/**
 * Japanese (Japan) locale overrides layered on top of `en-US`.
 *
 * Maintains a single source of truth in the English catalog and avoids cross-locale drift.
 */
import type { AppTranslationOverrides } from "~/locales/en-US";

const jaJPOverrides = {
  meta: {
    title: "BaoBuildBuddy - AIキャリアアシスタント",
    description: "ゲーム業界向けAIキャリアアシスタント",
  },
  app: {
    tagline: "ゲーム開発向けAIキャリアアシスタント",
  },
  common: {
    relativeTime: {
      justNow: "たった今",
      minutesAgo: "{count}分前",
      hoursAgo: "{count}時間前",
      daysAgo: "{count}日前",
      weeksAgo: "{count}週前",
    },
  },
  a11y: {
    toggleSidebar: "サイドバーを切り替え",
    toggleTheme: "テーマを切り替え",
    openSettings: "設定を開く",
    primaryNavigation: "メインナビゲーション",
    mobilePrimaryNavigation: "モバイルメインナビゲーション",
    toggleSidebarNavigation: "サイドバーナビゲーションを切り替え",
    sidebarNavigation: "サイドバーナビゲーション",
    closeSidebar: "サイドバーを閉じる",
    skipToContent: "コンテンツへスキップ",
    breadcrumbs: "パンくずリスト",
    notifications: "通知",
    dismissNotification: "通知を閉じる",
    localeSwitcher: "言語を変更",
  },
  confirmDialog: {
    confirmButton: "確認",
    cancelButton: "キャンセル",
  },
  errorPage: {
    title: "{brand}でエラーが発生しました",
    fallbackMessage: "問題が発生しました。",
    statusLabel: "ステータス",
    backToDashboardButton: "ダッシュボードに戻る",
    resetButton: "リセット",
  },
  nav: {
    dashboard: "ダッシュボード",
    jobs: "求人",
    resume: "履歴書",
    coverLetter: "カバーレター",
    portfolio: "ポートフォリオ",
    interview: "面接",
    skills: "スキル",
    studios: "スタジオ",
    aiChat: "AIチャット",
    automation: "自動化",
    gamification: "ゲーミフィケーション",
    settings: "設定",
  },
  jobCard: {
    remoteBadge: "リモート",
    hybridBadge: "ハイブリッド",
    matchBadge: "{score}% マッチ",
    matchBadgeAria: "マッチスコア {score} パーセント",
    moreTechnologies: "+{count} 件追加",
  },
  resumePreview: {
    printButton: "印刷",
    printAria: "履歴書プレビューを印刷",
    notFound: "履歴書が見つかりません。プレビューする履歴書を選択してください。",
  },
  portfolioPage: {
    preview: {
      backButton: "ビルダーに戻る",
      backButtonAria: "ポートフォリオビルダーに戻る",
      exportPdfButton: "PDFをエクスポート",
      exportPdfAria: "ポートフォリオプレビューをPDFでエクスポート",
      defaultTitle: "私のポートフォリオ",
      contactButton: "連絡する",
      contactAria: "メールでポートフォリオ所有者に連絡する",
      websiteButton: "ウェブサイトを見る",
      websiteAria: "ポートフォリオのウェブサイトを開く",
      featuredProjectsTitle: "注目プロジェクト",
      moreProjectsTitle: "その他のプロジェクト",
      viewButton: "表示",
      emptyState:
        "表示するプロジェクトがありません。ポートフォリオビルダーでプロジェクトを追加してください。",
      notFound: "ポートフォリオが見つかりません。先にポートフォリオを作成してください。",
    },
  },
  interviewScoreCard: {
    title: "面接パフォーマンス分析",
    progressAria: "面接の総合スコア {score} パーセント",
    overallScore: "総合スコア",
    strengths: "強み",
    areasForImprovement: "改善点",
    recommendations: "推奨事項",
  },
  dailyChallengeCard: {
    completedBanner: "完了！",
    completeButton: "チャレンジを完了",
    completedButton: "完了済み",
    completeAria: "デイリーチャレンジ {title} を完了",
  },
  interviewSession: {
    title: "面接練習",
    timeLabel: "時間",
    timeAria: "経過した面接時間 {minutes}分 {seconds}秒",
    progressLabel: "質問 {current} / {total}",
    progressAria: "面接の進捗",
    jobTargetBadge: "対象職種",
    interviewerLabel: "面接官",
    feedbackTitle: "フィードバック",
    feedbackScore: "スコア: {score}%",
    responseTitle: "あなたの回答",
    responsePlaceholder: "ここに回答を入力してください...",
    responseAria: "面接回答テキスト",
    minResponseHint: "回答は{count}文字以上で入力してください。",
    endAria: "面接セッションを終了",
    endButton: "面接を終了",
    submitAria: "面接回答を送信",
    submitNextButton: "送信して次へ",
    submitFinishButton: "送信して終了",
    notFound: "セッションが見つかりません。新しい面接を開始してください。",
    voice: {
      listening: "音声を聞き取っています...",
      idle: "音声入力",
      startTitle: "音声入力を開始",
      stopTitle: "聞き取りを停止",
      startAria: "音声入力を開始",
      stopAria: "音声入力を停止",
      startButton: "マイク",
      stopButton: "停止",
    },
    toasts: {
      responseRecorded: "回答を記録しました",
      completed: "面接が完了しました",
    },
    errors: {
      minResponseLength: "回答は{count}文字以上で入力してください",
      submitFailed: "回答の送信に失敗しました",
      completeFailed: "面接の完了に失敗しました",
    },
  },
  aiChatCommon: {
    timeAt: "{time} の時刻",
    voice: {
      listeningStatus: "聴取中...",
      speakingStatus: "応答を読み上げ中...",
      idleStatus: "音声準備完了",
    },
  },
} as const satisfies AppTranslationOverrides;

export default jaJPOverrides;
