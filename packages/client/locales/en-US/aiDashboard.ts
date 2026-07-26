const aiDashboard = {
  aiDashboard: {
    title: "AI Dashboard",
    subtitle:
      "Manage provider readiness, test connectivity, and set your preferred model using one centralized control surface.",
    stats: {
      totalRequestsTitle: "Total Requests",
      totalRequestsDesc: "Messages sent through AI services",
      successRateTitle: "Success Rate",
      successRateDesc: "Assistant responses relative to user prompts",
      averageResponseTitle: "Avg Response Time",
      averageResponseValue: "{seconds}s",
      averageResponseDesc: "Measured latency across chat requests",
      sessionsTitle: "Sessions",
      sessionsDesc: "Active provider: {provider}",
    },
    preference: {
      title: "Provider Preference",
      description:
        "Choose the primary provider and default model for AI chat and generation flows.",
      providerLegend: "Provider",
      providerAria: "Preferred AI provider",
      modelLegend: "Model",
      modelAria: "Preferred AI model",
      selectProviderOption: "Select provider",
      selectModelOption: "Select model",
      providerNotConfiguredOption: "{provider} (Not configured)",
      saveButton: "Save Preference",
      saveAria: "Save preferred AI provider and model",
      refreshButton: "Refresh",
      refreshAria: "Refresh AI provider dashboard data",
    },
    providerCard: {
      notConfiguredBadge: "Not configured",
      testButton: "Test Connection",
      testAria: "Test {provider} connectivity",
      configureButton: "Configure",
      configureAria: "Open settings to configure {provider}",
      testingLabel: "Testing...",
    },
    availability: {
      available: "Available",
      unavailable: "Unavailable",
    },
    health: {
      healthy: "Healthy",
      degraded: "Degraded",
      down: "Down",
      unconfigured: "Unconfigured",
    },
    alerts: {
      noProvidersTitle: "No providers detected",
      noProvidersDescription:
        "Configure at least one AI provider in Settings to enable chat and generation features.",
      configureProvidersCta: "Open AI Providers",
      configureProvidersAria: "Open Settings AI Providers to configure credentials",
      testSuccessTitle: "Connectivity OK",
      testErrorTitle: "Connectivity failed",
    },
    tests: {
      localSuccess: "Local AI provider is reachable.",
      localFailure: "Local AI provider is not reachable.",
      missingCredential: "No credential is available for this provider.",
      connectionSuccess: "Connection successful.",
      connectionFailure: "Connection failed.",
    },
    errors: {
      usageLoadFailed: "Failed to load AI usage metrics.",
      modelsLoadFailed: "Failed to load AI model catalog.",
      preferenceSaveFailed: "Failed to save AI preference.",
    },
    toasts: {
      loadFailed: "Failed to load AI dashboard data.",
      preferenceSaved: "AI preference saved.",
      preferenceSaveFailed: "Failed to save AI preference.",
    },
  },
} as const;

export default aiDashboard;
