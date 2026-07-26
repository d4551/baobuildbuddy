const skillsPathwaysPage = {
  skillsPathwaysPage: {
    seoTitle: "Career Pathways",
    seoDescription:
      "Evaluate career readiness and discover role pathways based on your mapped transferable skills.",
    title: "Career Pathways",
    subtitle:
      "Track readiness and explore role pathways generated from your mapped skill evidence.",
    retryButtonLabel: "Retry",
    retryAria: "Retry loading career pathways",
    categories: {
      technical: "Technical",
      softSkills: "Soft Skills",
      industryKnowledge: "Industry Knowledge",
      portfolio: "Portfolio",
    },
    readiness: {
      title: "Your Career Readiness",
      overallReadinessLabel: "Overall readiness",
      overallReadinessAria: "Overall readiness score {score} percent",
      categoryScoresLabel: "Category scores",
      categoryScoreAria: "{category} readiness score {score} percent",
      topImprovementsTitle: "Top improvements",
      nextStepsTitle: "Next steps",
      feedback: {
        empty: "{category} readiness data is not available yet.",
        early: "Early stage {category}. Focus on adding more mappings and evidence.",
        developing: "Developing {category}. Keep adding mapped examples and proof.",
        good: "Good {category}. Continue building depth to strengthen this area.",
        excellent: "Excellent {category}. You are well-prepared in this area.",
      },
      improvements: {
        imp_tech_map: "Map more technical gaming skills to career-ready technical skills.",
        imp_conf_up: "Increase confidence ratings for your existing technical mappings.",
        imp_lead_comm: "Map more leadership and communication experiences.",
        imp_team_examples: "Add concrete team collaboration examples.",
        imp_industry_research: "Research additional industry applications for your mapped skills.",
        imp_role_link: "Connect mapped skills to specific target job roles.",
        imp_evidence_add:
          "Add evidence for your mapped skills with clips, screenshots, or documents.",
        imp_portfolio_build: "Build portfolio projects to demonstrate applied skills.",
        imp_achievements_doc: "Document measurable achievements for your strongest mappings.",
        imp_transfer_strengthen:
          "Strengthen technical transfer by mapping game mechanics to engineering concepts.",
        imp_leadership_highlight:
          "Highlight leadership and communication experience from gaming contexts.",
        imp_coverage_broaden: "Broaden skill coverage by mapping 10-15 diverse skills.",
        imp_examples_refine: "Refine current mappings with more specific examples.",
        imp_certs_pursue: "Pursue certifications that validate your technical strengths.",
        imp_network_pro: "Network with professionals in your target industry.",
      },
      nextStepItems: {
        step_apply_roles: "Start applying to target roles.",
        step_network_industry: "Network with industry professionals.",
        step_prepare_interviews: "Prepare for technical interviews.",
        step_polish_linkedin: "Polish your LinkedIn profile.",
        step_complete_portfolio: "Complete your portfolio with 3-5 strong projects.",
        step_map_skills_15: "Map 5 more skills to reach 15+ total.",
        step_evidence_top: "Add evidence to your top 10 skills.",
        step_research_targets: "Research target companies and roles.",
        step_map_skills_10: "Map 10+ gaming skills to career skills.",
        step_start_portfolio: "Start building portfolio projects.",
        step_evidence_abilities: "Add evidence to demonstrate your abilities.",
        step_explore_pathways: "Explore career pathways that match your skills.",
        step_map_skills_5: "Map your first 5 gaming skills.",
        step_explore_categories: "Explore different skill categories.",
        step_learn_careers: "Learn about career options in the gaming industry.",
        step_setup_profile: "Set up your professional profile.",
      },
      emptyStateTitle: "Readiness data is not available yet",
      emptyStateDescription:
        "Add more mapped skill evidence and rerun readiness analysis to populate this section.",
    },
    pathways: {
      title: "Pathway Recommendations",
      requiredSkillsTitle: "Required skills",
      matchScoreLabel: "Match score",
      matchScoreAria: "{title} pathway match score {score} percent",
      estimatedTimeLabel: "Estimated time to entry:",
      marketTrendLabel: "Market trend:",
      marketTrend: {
        growing: "Growing",
        stable: "Stable",
        declining: "Declining",
      },
      emptyStateTitle: "No pathways available yet",
      emptyStateDescription:
        "Expand your mapped skills to unlock stronger role recommendations and pathway coverage.",
    },
    errors: {
      loadFailed: "Failed to load career pathways data",
      pathwaysLoadFailed: "Failed to load pathway recommendations",
      readinessLoadFailed: "Failed to load readiness assessment",
      gamificationLoadFailed: "Failed to load gamification progress for this page",
    },
    gamification: {
      openProgressAria: "Open gamification progress",
      levelLabel: "Lvl {level}",
      xpLabel: "{xp} XP",
      retryAria: "Retry loading gamification progress",
      retryButton: "Retry",
      unavailableHint: "Progress unavailable",
    },
  },
} as const;

export default skillsPathwaysPage;
