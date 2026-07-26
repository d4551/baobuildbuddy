const common = {
  common: {
    save: "Save",
    loading: "Loading",
    exportMenu: {
      formatAria: "{action} {format}",
      formats: {
        pdf: "PDF",
        docx: "DOCX",
      },
    },
    localeNames: {
      enUS: "English",
      esES: "Spanish",
      frFR: "French",
      jaJP: "Japanese",
    },
    workMode: {
      remote: "Remote",
      hybrid: "Hybrid",
    },
    relativeTime: {
      justNow: "just now",
      minutesAgo: "{count}m ago",
      hoursAgo: "{count}h ago",
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{count}d ago",
      weeksAgo: "{count}w ago",
      monthsAgo: "{count}mo ago",
      unknown: "Unknown",
    },
  },
} as const;

export default common;
