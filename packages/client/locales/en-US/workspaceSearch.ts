const workspaceSearch = {
  workspaceSearch: {
    openButtonAria: "Open workspace search (Ctrl or Cmd+K)",
    title: "Search workspace",
    placeholder: "Search jobs, letters, portfolio, interviews, runs…",
    inputAria: "Workspace search query",
    submitAria: "Run workspace search",
    submitButton: "Search",
    emptyTitle: "Start typing to search",
    emptyDescription:
      "Enter at least two characters to search jobs, letters, portfolio, interviews, and runs.",
    emptyCta: "Browse jobs",
    emptyCtaAria: "Browse the job board",
    noResultsTitle: "No results",
    noResultsDescription: "Try a different keyword or clear filters in the destination surface.",
    noResultsCta: "Clear search",
    noResultsCtaAria: "Clear workspace search query",
    resultAria: "Open {title}",
    typeLabel: {
      jobs: "Job",
      studios: "Studio",
      resumes: "Resume",
      skills: "Skill",
      "cover-letters": "Cover letter",
      "portfolio-projects": "Portfolio",
      "interview-sessions": "Interview",
      "automation-runs": "Automation",
    },
    searchFailed: "Workspace search failed",
    autocompleteFailed: "Failed to fetch autocomplete suggestions",
    suggestionsAria: "Search suggestions",
    suggestionAria: "Use suggestion {text}",
    closeAria: "Close workspace search",
  },
} as const;

export default workspaceSearch;
