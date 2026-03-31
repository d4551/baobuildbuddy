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
        noIssues: "No issues detected.",
        category: {
          job_apply: "Job Apply",
          scrape: "Scrape",
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
          category: "Category",
          configured: "Configured",
          manual: "Manual",
          scheduled: "Scheduled",
          history: "History",
          live: "Live",
          notes: "Notes",
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
