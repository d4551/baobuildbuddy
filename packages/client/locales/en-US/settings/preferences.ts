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
      workspaceBackupTitle: "Workspace backup",
      workspaceBackupDescription:
        "Export or restore resumes, settings, interviews, and related workspace data as a single JSON backup.",
      exportButton: "Export workspace",
      exportAria: "Download a workspace backup JSON file",
      importButton: "Import workspace",
      importAria: "Import a workspace backup JSON file",
      importFileAria: "Choose a workspace backup JSON file to import",
      exportSuccess: "Workspace backup downloaded",
      importSuccess: "Workspace backup imported",
      importInvalid: "Selected file is not a valid workspace backup",
    },
  },
} as const;

export default settingspreferences;
