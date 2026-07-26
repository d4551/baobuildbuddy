const interviewSession = {
  interviewSession: {
    title: "面接練習",
    timeLabel: "時間",
    timeAria: "経過した面接時間 {minutes}分 {seconds}秒",
    progressLabel: "質問 {current} / {total}",
    progressAria: "面接の進捗",
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
} as const;

export default interviewSession;
