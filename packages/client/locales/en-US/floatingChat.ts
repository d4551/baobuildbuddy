const floatingChat = {
  floatingChat: {
    contextBadge: "Context: {context}",
    focusedEntityBadge: "Focus: {entity}",
    entityChip: "{type}: {entity}",
    contextDomain: {
      resume: "Resume",
      jobSearch: "Jobs",
      interview: "Interview",
      portfolio: "Portfolio",
      skills: "Skills",
      automation: "Automation",
      general: "General",
    },
    entityTypes: {
      job: "Job",
      resume: "Resume",
      studio: "Studio",
      interviewSession: "Interview",
      automationRun: "Automation",
    },
    stateChips: {
      resumes: "{count} resume | {count} resumes",
      jobs: "{count} tracked job | {count} tracked jobs",
      studios: "{count} studio | {count} studios",
      sessions: "{count} session | {count} sessions",
      projects: "{count} project | {count} projects",
    },
    suggestionsAria: "Contextual assistant prompt suggestions",
    suggestionAria: "Use contextual prompt: {prompt}",
    prompts: {
      focusedEntity: "Give me focused coaching for {target}.",
      resume: "How can I improve this resume for {target}?",
      jobSearch: "How should I approach this role at {target}?",
      interview: "Generate interview prep questions for {target}.",
      portfolio: "How can I tailor my portfolio for {target}?",
      skills: "What skills should I prioritize next for {target}?",
      automation: "How can I optimize this automation flow for {target}?",
      general: "What should I focus on next in my job search?",
      entity: {
        job: "Summarize the fit and next steps for {target}.",
        resume: "Identify the strongest upgrades for {target}.",
        studio: "Coach me on how to approach {target}.",
        interviewSession: "Review the signals and coaching points for {target}.",
        automationRun: "Explain what happened in {target} and what to fix next.",
      },
    },
  },
} as const;

export default floatingChat;
