const studioAnalytics = {
  studioAnalytics: {
    title: "Studio Analytics",
    description:
      "Review studio distribution, remote-work coverage, and shared technology trends from the indexed studio dataset.",
    errorBannerAria: "Studio analytics error",
    retryAria: "Retry loading studio analytics",
    retryButton: "Retry",
    openDirectoryAria: "Open the studio directory",
    emptyTitle: "No studio analytics available",
    emptyDescription:
      "Refresh studio data from the directory or scraper hub to populate analytics for this workspace.",
    progressAria: "Progress for {label}",
    remoteWorkProgressAria: "Remote work availability: {value} percent",
    overview: {
      totalStudiosTitle: "Total Studios",
      totalStudiosDesc: "In database",
      remoteFriendlyTitle: "Remote Friendly",
      remoteFriendlyDesc: "Offer remote positions",
      indieStudiosTitle: "Indie Studios",
      percentageOfTotal: "{value}% of total",
    },
    sections: {
      byTypeTitle: "Studios by Type",
      bySizeTitle: "Studios by Size",
      topTechnologiesTitle: "Most Common Technologies",
      topTechnologiesDescription: "Technologies used across game studios",
      remoteAvailabilityTitle: "Remote Work Availability",
      offerRemoteLabel: "Offer Remote",
      remoteFriendlyTitle: "Remote Friendly",
      onSiteOnlyTitle: "On-site Only",
    },
    errors: {
      loadFailed: "Failed to load analytics data",
    },
  },
} as const;

export default studioAnalytics;
