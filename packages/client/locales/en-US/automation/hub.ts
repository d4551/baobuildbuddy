const automationhub = {
  automation: {
    hub: {
      pageTitle: "Automation Hub",
      pageDescription:
        "Run and track automation workflows across scraping, job apply, and email response pipelines.",
      title: "Automation",
      viewRunsButton: "View Runs",
      pipelineTitle: "Work Pipeline",
      pipelineDescription:
        "Move from job discovery to scraping, customization, automation, and XP progression with a single flow.",
      pipelineAria: "Career work pipeline",
      pipelineNextStepLabel: "Next workflow milestone: {step}",
      loadErrorFallback: "Failed to load automation hub metrics",
      retryButtonLabel: "Retry",
      retryAria: "Retry loading automation hub metrics",
      emptyStateTitle: "No automation data yet",
      emptyStateDescription:
        "Start a scraper or automation workflow to populate the hub with actionable run history and capability signals.",
      emptyStateCta: "Open Scraper Hub",
      stats: {
        totalRunsTitle: "Total Runs",
        totalRunsDescription: "Tracked automation executions",
        todayRunsTitle: "Today's Runs",
        todayRunsDescription: "Started today",
        successRateTitle: "Success Rate",
        successRateDescription: "Completed run history",
      },
      audit: {
        title: "RPA Capability Audit",
        description:
          "Verify which browser-automation workflows are implemented, configured, and fully observable.",
        aria: "RPA capability audit",
        openScraperButton: "Open Scraper Hub",
        openScraperAria: "Open scraper hub with expanded RPA targets",
        loadErrorFallback: "Failed to load the RPA capability audit.",
        available: "Available",
        needsConfig: "Needs Config",
        unavailable: "Unavailable",
        type: {
          jobApply: "Job apply workflow",
          scrape: "Scraper workflow",
        },
        capabilities: {
          jobApply: "Job Apply",
          studios: "Studios",
        },
        issueState: {
          ready: "Ready",
          needsAttention: "Needs attention",
        },
        issueSummaryAria: "Open setup issues for {capability}. {count} issue needs attention.",
        issues: {
          providerSettingsUnavailable: "Job provider settings are currently unavailable.",
          portalConfigurationMissing: "Add a gaming portal configuration for {portalId}.",
          portalDisabled: "Enable {portalName} in job provider settings.",
          portalFallbackUrlMissing: "Add a fallback URL for {portalName}.",
        },
        actions: {
          fixSetup: "Fix Setup",
          fixSetupAria: "Open settings to fix scrape setup issues",
          openJobApply: "Open Job Apply",
          openJobApplyAria: "Open the job apply automation workflow",
          openScraper: "Open Scraper",
          openScraperAria: "Open the scraper automation workflow",
        },
        coverage: {
          manual: "Manual run supported",
          scheduled: "Scheduled run supported",
          history: "Run history tracked",
          live: "Live updates available",
        },
        summary: {
          total: "Capabilities",
          totalDesc: "Implemented RPA workflows",
          configured: "Configured",
          configuredDesc: "Ready in the current environment",
          live: "Live Events",
          liveDesc: "Emit run progress updates",
        },
        tableAria: "RPA capability audit details",
        columns: {
          name: "Capability",
          configured: "Configured",
          manual: "Manual",
          scheduled: "Scheduled",
          history: "History",
          live: "Live",
          coverage: "Coverage",
          issues: "Issues",
          actions: "Actions",
        },
      },
      cards: {
        scraper: {
          title: "Scraper Workflows",
          description: "Run studio and job scrapers to refresh discovery data.",
          button: "Open Scraper Hub",
        },
        jobApply: {
          title: "Job Apply",
          description:
            "Start or schedule an RPA job application using your saved resume and cover letter.",
          button: "Open Job Apply",
        },
        emailResponse: {
          title: "Email Response",
          description: "Generate AI-assisted email replies and track each run for auditability.",
          button: "Open Email Response",
        },
        runHistory: {
          title: "Run History",
          description: "Inspect full payloads, screenshots, and execution output.",
          button: "Open Run History",
        },
      },
    },
  },
} as const;

export default automationhub;
