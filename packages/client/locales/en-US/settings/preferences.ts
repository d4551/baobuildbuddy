const settingspreferences = {
  settings: {
    preferences: {
      title: "Preferences",
      subtitle: "Tune theme, language, and notification defaults for your workspace.",
      themeLabel: "Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      toggleThemeAria: "Toggle theme preference",
      languageLegend: "Language",
      languageAria: "Language",
      notificationsLegend: "Notifications",
      notifications: {
        achievements: "Achievements",
        achievementsAria: "Achievement notifications",
        dailyChallenges: "Daily challenges",
        dailyChallengesAria: "Daily challenge notifications",
        levelUp: "Level up",
        levelUpAria: "Level up notifications",
        jobAlerts: "Job alerts",
        jobAlertsAria: "Job alert notifications",
      },
      saveAria: "Save user preferences",
      saveButton: "Save Preferences",
    },
  },
} as const;

export default settingspreferences;
