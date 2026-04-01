const automationruns = {
  automation: {
    runs: {
      title: "Automation Runs",
      backButton: "Back to Automation",
      backToAutomation: "Back to automation overview",
      typeLabel: "Type",
      typeFilterAria: "Filter automation runs by type",
      allTypes: "All types",
      statusLabel: "Status",
      statusFilterAria: "Filter automation runs by status",
      allStatuses: "All statuses",
      tableAriaLabel: "Automation run history",
      emptyJobId: "N/A",
      emptyState: "No runs found.",
      loadingLabel: "Loading runs...",
      loadErrorTitle: "Unable to load runs",
      loadErrorFallback: "Could not load run history.",
      openRunDetailAria: "Open automation run details for {id}",
      openButton: "Open",
      liveBadge: "Live",
      liveBadgeAria: "Live automation run status",
      columns: {
        id: "Run ID",
        type: "Type",
        status: "Status",
        progress: "Progress",
        job: "Job",
        updated: "Updated",
        actions: "Actions",
      },
      typeOptions: {
        scrape: "Scraper",
        job_apply: "Job Apply",
        email: "Email",
      },
      statusOptions: {
        pending: "Pending",
        running: "Running",
        success: "Success",
        error: "Error",
      },
    },
  },
} as const;

export default automationruns;
