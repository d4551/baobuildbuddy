const jobCard = {
  jobCard: {
    viewAria: "View job: {title} at {company}",
    saveAria: "Save job",
    unsaveAria: "Unsave job",
    remoteBadge: "Remote",
    hybridBadge: "Hybrid",
    matchBadge: "{score}% Match",
    matchBadgeAria: "Match score {score} percent",
    moreTechnologies: "+{count} more",
    relativeTime: {
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{count}d ago",
      weeksAgo: "{count}w ago",
      monthsAgo: "{count}mo ago",
      unknown: "—",
    },
  },
} as const;

export default jobCard;
