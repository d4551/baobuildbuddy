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
      enUS: "Anglais",
      esES: "Espagnol",
      frFR: "Français",
      jaJP: "Japonais",
    },
    relativeTime: {
      justNow: "à l'instant",
      minutesAgo: "il y a {count}min",
      hoursAgo: "il y a {count}h",
      daysAgo: "il y a {count}j",
      weeksAgo: "il y a {count}s",
    },
  },
} as const;

export default catalog;
