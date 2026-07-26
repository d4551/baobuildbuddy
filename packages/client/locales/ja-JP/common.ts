const common = {
  common: {
    workMode: {
      remote: "リモート",
      hybrid: "ハイブリッド",
    },
    relativeTime: {
      justNow: "たった今",
      minutesAgo: "{count}分前",
      hoursAgo: "{count}時間前",
      today: "今日",
      yesterday: "昨日",
      daysAgo: "{count}日前",
      weeksAgo: "{count}週間前",
      monthsAgo: "{count}か月前",
      unknown: "不明",
    },
    loading: "読み込み中",
    localeNames: {
      enUS: "英語",
      esES: "スペイン語",
      frFR: "フランス語",
      jaJP: "日本語",
    },
  },
} as const;

export default common;
