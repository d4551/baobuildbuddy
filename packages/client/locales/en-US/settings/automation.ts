const settingsautomation = {
  settings: {
    automation: {
      title: "Automation & RPA",
      subtitle: "Configure browser automation defaults for job applications.",
      headlessTitle: "Headless Mode",
      headlessDescription: "Run browser automation without visible UI",
      headlessAria: "Headless mode",
      smartSelectorsTitle: "Smart AI Selectors",
      smartSelectorsDescription: "Detect form fields dynamically",
      smartSelectorsAria: "Smart selectors",
      autoScreenshotsTitle: "Auto-save Screenshots",
      autoScreenshotsDescription: "Capture each automation stage",
      autoScreenshotsAria: "Auto save screenshots",
      timeoutLegend: "Default Timeout (seconds)",
      timeoutAria: "Default timeout in seconds",
      retentionLegend: "Screenshot Retention (days)",
      retentionAria: "Screenshot retention in days",
      concurrentRunsLegend: "Max Concurrent Runs",
      concurrentRunsAria: "Maximum concurrent automation runs",
      defaultBrowserLegend: "Default Browser",
      defaultBrowserAria: "Default automation browser",
      browserOptions: {
        chrome: "Chrome",
        chromium: "Chromium",
        edge: "Edge",
      },
      saveAria: "Save automation settings",
      saveButton: "Save Automation",
    },
  },
} as const;

export default settingsautomation;
