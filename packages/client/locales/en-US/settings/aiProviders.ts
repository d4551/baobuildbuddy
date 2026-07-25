const settingsaiProviders = {
  settings: {
    aiProviders: {
      configureCta: "Configure AI Providers",
      configureCtaAria: "Open AI Providers settings to finish configuration",
      title: "AI Providers",
      subtitle: "Keep local providers as primary and cloud providers as controlled fallbacks.",
      openaiV1Title: "OpenAI Chat Completions API",
      openaiV1Description:
        "Point OpenAI SDKs at this base URL with your Bao API key as the Bearer token (models + chat/completions).",
      openaiV1Aria: "OpenAI Chat Completions API base URL",
      expandAria: "Expand {provider} provider settings",
      configuredBadge: "Configured",
      endpointLabel: "Endpoint URL",
      credentialLabel: "API Key",
      huggingFacePlaceholder: "Enter Hugging Face token",
      apiKeyPlaceholder: "Enter {provider} API key",
      testAria: "Test AI provider connection",
      testButton: "Test",
      localModelLegend: "Local model name",
      localModelPlaceholder: "Auto-detected from server",
      localModelAria: "Local model name",
      connectedBadge: "Connected",
      failedBadge: "Failed",
      saveAria: "Save AI provider credentials",
      saveButton: "Save API Keys",
      connectionSuccessful: "Connection successful",
      connectionFailed: "Connection failed",
      preferredProviderLegend: "Preferred AI Provider",
      preferredProviderAria: "Select preferred AI provider",
      preferredProviderSaveButton: "Save chat default",
      preferredProviderHint:
        "This quick control sets the default provider for chat and conversational surfaces.",
      readinessTitle: "Provider readiness",
      readinessDescription:
        "Check configuration and connectivity before assigning providers to workflows.",
      preferredProviderSaved: "Preferred provider updated",
      routingTitle: "Purpose-based routing",
      routingSubtitle:
        "Assign a provider and optional model to each AI capability so chat, interview, export, and automation flows do not share one global default.",
      routingCoverageTitle: "Routed workflows",
      routingCoverageDescription:
        "Each AI capability can keep its own provider and optional model override.",
      saveRoutingAria: "Save AI routing by purpose",
      saveRoutingButton: "Save routing",
      routingSaved: "AI routing saved",
      purposeColumnLabel: "Purpose",
      purposeProviderLegend: "Provider",
      purposeProviderAria: "Select provider for {purpose}",
      purposeModelLegend: "Model override",
      purposeModelAria: "Set model override for {purpose}",
      purposeModelPlaceholder: "Leave blank to use the provider default or auto-detect",
      purposeModelHint:
        "Use a specific model only when this workflow needs one. Leaving it blank preserves provider defaults.",
      purposes: {
        chat: {
          label: "Chat",
          description: "General chat, assistant replies, and interactive conversations.",
        },
        interviewQuestions: {
          label: "Interview Questions",
          description: "Question generation, follow-ups, and conversational interview pacing.",
        },
        interviewFeedback: {
          label: "Interview Feedback",
          description: "Answer scoring, rubric feedback, and final interview summaries.",
        },
        resume: {
          label: "Resume",
          description: "Resume synthesis, enhancement, scoring, and structured CV outputs.",
        },
        coverLetter: {
          label: "Cover Letter",
          description: "Cover-letter drafting, refinement, and export-ready wording.",
        },
        emailResponse: {
          label: "Email Response",
          description: "Recruiter reply drafts and automation email generation.",
        },
        jobMatch: {
          label: "Job Match",
          description: "Job-fit scoring, role analysis, and recommendation summaries.",
        },
        scrapeEnrichment: {
          label: "Scrape Enrichment",
          description: "Studio persona enrichment and post-scrape hiring-signal analysis.",
        },
        automationFieldMapping: {
          label: "Automation Mapping",
          description: "Field mapping, selector inference, and structured form automation.",
        },
      },
      ollamaTipTitle: "Hot tip: Ollama runs outside this app",
      ollamaTipDescription:
        "Install it first and follow Ollama's setup for your own machine or project at",
      ollamaTipLinkLabel: "ollama.com",
      ollamaTipLinkAria: "Open Ollama website in a new tab",
      credentialsDescription:
        "Store and test credentials only for the providers you plan to route into live workflows.",
    },
  },
} as const;

export default settingsaiProviders;
