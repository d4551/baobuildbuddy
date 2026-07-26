const common = {
  common: {
    workMode: {
      remote: "Télétravail",
      hybrid: "Hybride",
    },
    relativeTime: {
      justNow: "à l'instant",
      minutesAgo: "il y a {count} min",
      hoursAgo: "il y a {count} h",
      today: "Aujourd'hui",
      yesterday: "Hier",
      daysAgo: "il y a {count} j",
      weeksAgo: "il y a {count} sem.",
      monthsAgo: "il y a {count} mois",
      unknown: "Inconnu",
    },
    loading: "Chargement",
    localeNames: {
      enUS: "Anglais",
      esES: "Espagnol",
      frFR: "Français",
      jaJP: "Japonais",
    },
  },
} as const;

export default common;
