const settingsjobIntelligence = {
  settings: {
    jobIntelligence: {
      title: "Job Intelligence",
      subtitle:
        "Manage scraper provider settings and the persisted jobs taxonomy used for enrichment and autocomplete.",
      providersTitle: "Provider Configuration",
      taxonomyTitle: "Persisted Taxonomy",
      providerTimeoutLabel: "Provider timeout (ms)",
      companyLimitLabel: "Company board result limit",
      gamingLimitLabel: "Gaming board result limit",
      hitmarkerEnabledLabel: "Enable Hitmarker API",
      unknownLocationLabel: "Unknown location label",
      unknownCompanyLabel: "Unknown company label",
      hitmarkerApiLabel: "Hitmarker API base URL",
      hitmarkerQueryLabel: "Hitmarker default query",
      hitmarkerLocationLabel: "Hitmarker fallback location",
      greenhouseApiLabel: "Greenhouse API base URL",
      greenhouseMaxPagesLabel: "Greenhouse max pages",
      leverApiLabel: "Lever API base URL",
      leverMaxPagesLabel: "Lever max pages",
      greenhouseBoardsLabel: "Greenhouse boards JSON",
      leverCompaniesLabel: "Lever companies JSON",
      companyBoardsLabel: "Company boards JSON",
      companyTemplatesLabel: "Company board templates JSON",
      gamingPortalsLabel: "Gaming portals JSON",
      taxonomyKeywordsLabel: "Taxonomy keywords JSON",
      taxonomyStudiosLabel: "Studio classification rules JSON",
      saveProviders: "Save Provider Config",
      saveTaxonomy: "Save Taxonomy",
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
