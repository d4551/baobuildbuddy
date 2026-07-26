const common = {
  common: {
    workMode: {
      remote: "Remoto",
      hybrid: "Híbrido",
    },
    relativeTime: {
      justNow: "ahora mismo",
      minutesAgo: "hace {count}m",
      hoursAgo: "hace {count}h",
      today: "Hoy",
      yesterday: "Ayer",
      daysAgo: "hace {count}d",
      weeksAgo: "hace {count}s",
      monthsAgo: "hace {count}mes",
      unknown: "Desconocido",
    },
    loading: "Cargando",
    localeNames: {
      enUS: "Inglés",
      esES: "Español",
      frFR: "Francés",
      jaJP: "Japonés",
    },
  },
} as const;

export default common;
