const studioDetail = {
  studioDetail: {
    breadcrumbs: {
      dashboard: "Dashboard",
      studios: "Studios",
      detail: "Studio Detail",
    },
    retryAria: "Retry loading studio details",
    retryButton: "Retry",
    noDescription: "No studio description available.",
    unknownLocation: "Unknown location",
    noCultureWorkStyle: "No culture details provided yet.",
    remoteFriendlyBadge: "Remote Friendly",
    practiceInterviewAria: "Start interview practice for this studio",
    practiceInterviewButton: "Practice Interview",
    visitWebsiteAria: "Open website for {studio}",
    visitWebsiteButton: "Visit Website",
    sections: {
      culture: "Studio Culture",
      interviewProcess: "Interview Process",
      technologies: "Technologies Used",
      info: "Studio Info",
      notableGames: "Notable Games",
    },
    culture: {
      workStyleLabel: "Work Style",
      environmentLabel: "Environment",
      valuesLabel: "Core Values",
      noValues: "No culture values listed yet.",
    },
    info: {
      locationLabel: "Location",
      studioTypeLabel: "Studio Type",
      companySizeLabel: "Company Size",
      remoteWorkLabel: "Remote Work",
    },
    remoteLabels: {
      yes: "Yes",
      no: "No",
    },
    emptyTitle: "Studio unavailable",
    emptyDescription:
      "This studio profile is no longer available. Return to the directory and choose another studio context.",
    browseDirectoryButton: "Browse studios",
    browseDirectoryAria: "Return to the studio directory",
    errors: {
      invalidStudioId: "Invalid studio identifier.",
      notFound: "Studio not found.",
      loadFailed: "Failed to load studio details.",
    },
  },
} as const;

export default studioDetail;
