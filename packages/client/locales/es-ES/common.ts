const catalog = {
  common: {
    exportMenu: {
      formatAria: "{action} {format}",
      formats: {
        pdf: "PDF",
        docx: "DOCX",
      },
    },
    localeNames: {
      enUS: "Inglés",
      esES: "Español",
      frFR: "Francés",
      jaJP: "Japonés",
    },
    relativeTime: {
      justNow: "ahora mismo",
      minutesAgo: "hace {count}m",
      hoursAgo: "hace {count}h",
      daysAgo: "hace {count}d",
      weeksAgo: "hace {count}s",
    },
  },
} as const;

export default catalog;
