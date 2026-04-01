const settingsjobIntelligence = {
  settings: {
    jobIntelligence: {
      title: "Job Intelligence",
      subtitle:
        "Manage scraper provider settings and the persisted jobs taxonomy used for enrichment and autocomplete.",
      providersTitle: "Provider Configuration",
      providersDescription:
        "Keep the shared fetch defaults visible, tune each source in its own card, and hide raw source payloads until you need them.",
      taxonomyTitle: "Persisted Taxonomy",
      taxonomyDescription:
        "Shape the saved keyword and studio classification datasets that downstream matching, enrichment, and interview flows depend on.",
      summarySourcesTitle: "Active sources",
      summarySourcesDescription: "Enabled providers with enough configuration to fetch jobs.",
      summaryCollectionsTitle: "Source collections",
      summaryCollectionsDescription:
        "Advanced JSON datasets stored for boards, templates, and gaming portals.",
      summaryTaxonomyTitle: "Taxonomy assets",
      summaryTaxonomyDescription:
        "Saved keyword and studio rule datasets used across enrichment and autocomplete.",
      defaultsTitle: "Shared defaults",
      defaultsDescription:
        "These defaults apply across every source before provider-specific rules kick in.",
      providerTimeoutLabel: "Provider timeout (ms)",
      companyLimitLabel: "Company board result limit",
      gamingLimitLabel: "Gaming board result limit",
      hitmarkerEnabledLabel: "Enable Hitmarker API",
      hitmarkerEnabledHint:
        "Toggle the first-party Hitmarker feed without hiding the rest of the workspace.",
      unknownLocationLabel: "Unknown location label",
      unknownCompanyLabel: "Unknown company label",
      configuredBadge: "Configured",
      needsAttentionBadge: "Needs attention",
      hitmarkerTitle: "Hitmarker",
      hitmarkerApiLabel: "Hitmarker API base URL",
      hitmarkerQueryLabel: "Hitmarker default query",
      hitmarkerLocationLabel: "Hitmarker fallback location",
      hitmarkerDescription:
        "Control the direct Hitmarker feed, default query seed, and fallback location copy.",
      greenhouseTitle: "Greenhouse",
      greenhouseApiLabel: "Greenhouse API base URL",
      greenhouseMaxPagesLabel: "Greenhouse max pages",
      greenhouseDescription:
        "Tune Greenhouse discovery and paging separately from the shared source defaults.",
      leverTitle: "Lever",
      leverApiLabel: "Lever API base URL",
      leverMaxPagesLabel: "Lever max pages",
      leverDescription:
        "Use a focused Lever card so URL and pagination changes stay local to that source.",
      advancedCollectionsTitle: "Advanced source collections",
      advancedCollectionsDescription:
        "Keep raw JSON payload editors collapsed until you need to adjust source mappings or template payloads.",
      advancedBadge: "Advanced",
      greenhouseBoardsLabel: "Greenhouse boards JSON",
      leverCompaniesLabel: "Lever companies JSON",
      companyBoardsLabel: "Company boards JSON",
      companyTemplatesLabel: "Company board templates JSON",
      gamingPortalsLabel: "Gaming portals JSON",
      taxonomyKeywordsLabel: "Taxonomy keywords JSON",
      taxonomyKeywordsDescription:
        "Persist keyword clusters used for autocomplete, matching, and role enrichment.",
      taxonomyStudiosLabel: "Studio classification rules JSON",
      taxonomyStudiosDescription:
        "Maintain the studio classification rules that feed company and studio-aware workflows.",
      saveProviders: "Save Provider Config",
      saveTaxonomy: "Save Taxonomy",
      saveProvidersAria: "Save job provider configuration",
      saveTaxonomyAria: "Save persisted taxonomy configuration",
      savingProviders: "Saving providers...",
      savingTaxonomy: "Saving taxonomy...",
      errors: {
        invalidProviderConfig: "Provider configuration JSON is invalid.",
        invalidTaxonomy: "Taxonomy JSON is invalid.",
        failedToSaveProviders: "Failed to save job provider configuration.",
        failedToSaveTaxonomy: "Failed to save job taxonomy.",
      },
      toasts: {
        providersSaved: "Job provider configuration saved.",
        taxonomySaved: "Job taxonomy saved.",
      },
    },
  },
} as const;

export default settingsjobIntelligence;
