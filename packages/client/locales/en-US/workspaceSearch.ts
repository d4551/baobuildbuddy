const workspaceSearch = {
  workspaceSearch: {
    openButtonAria: "Open workspace search",
    title: "Search workspace",
    placeholder: "Search jobs, studios, resumes, skills…",
    inputAria: "Workspace search query",
    submitAria: "Run workspace search",
    submitButton: "Search",
    emptyTitle: "No matches yet",
    emptyDescription: "Enter at least two characters to search across your workspace.",
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
    },
    searchFailed: "Workspace search failed",
    autocompleteFailed: "Failed to fetch autocomplete suggestions",
    suggestionsAria: "Search suggestions",
    suggestionAria: "Use suggestion {text}",
    closeAria: "Close workspace search",
  },
} as const;

export default workspaceSearch;
