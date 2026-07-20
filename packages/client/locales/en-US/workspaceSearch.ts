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
    noResultsTitle: "No results",
    noResultsDescription: "Try a different keyword or clear filters in the destination surface.",
    resultAria: "Open {title}",
    typeLabel: {
      jobs: "Job",
      studios: "Studio",
      resumes: "Resume",
      skills: "Skill",
    },
    searchFailed: "Workspace search failed",
    closeAria: "Close workspace search",
  },
} as const;

export default workspaceSearch;
