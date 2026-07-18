const common = {
  common: {
    save: "Save",
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
    relativeTime: {
      justNow: "just now",
      minutesAgo: "{count}m ago",
      hoursAgo: "{count}h ago",
      daysAgo: "{count}d ago",
      weeksAgo: "{count}w ago",
    },
  },
} as const;

export default common;
