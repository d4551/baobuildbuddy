import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import {
  aiModelsResponses,
  aiUsageResponses,
  analyzeResumeResponses,
  automationActionResponses,
  chatRouteResponses,
  generateCoverLetterResponses as aiGenerateCoverLetterResponses,
  matchJobsResponses,
} from "./ai-route-contracts";
import {
  automationRouteErrorResponses,
  automationRunEnvelopeBodySchema,
  capabilityAuditReportBodySchema,
  routeErrorBodySchema,
} from "./automation-route-contracts";
import {
  authConfiguredResponses,
  authInitResponses,
  authStatusResponses,
} from "./auth-route-contracts";
import {
  coverLetterDeleteResponses,
  coverLetterEntityResponses,
  coverLetterExportResponses,
  coverLettersListResponses,
  generateCoverLetterResponses as coverLetterGenerateResponses,
} from "./cover-letter-route-contracts";
import {
  achievementsResponses,
  awardXpResponses,
  challengeCompleteResponses,
  challengesListResponses,
  gamificationProgressResponses,
  monthlyStatsResponses,
  weeklyProgressResponses,
} from "./gamification-route-contracts";
import {
  completeInterviewSessionResponses,
  createInterviewSessionResponses,
  interviewSessionResponses,
  interviewSessionsListResponses,
  interviewStatsResponses,
  submitInterviewResponseResponses,
} from "./interview-route-contracts";
import {
  applicationsListResponses,
  applyJobResponses,
  deleteSavedJobResponses,
  jobEntityResponses,
  jobsListResponses,
  jobsRefreshResponses,
  recommendationsResponses,
  saveJobResponses,
  savedJobsListResponses,
  updateApplicationResponses,
} from "./jobs-route-contracts";
import {
  portfolioExportResponses,
  portfolioMutationResponses,
  portfolioProjectDeleteResponses,
  portfolioProjectMutationResponses,
  portfolioProjectReorderResponses,
  portfolioResponses,
} from "./portfolio-route-contracts";
import {
  resumeCreateResponses,
  resumeDeleteResponses,
  resumeEnhanceResponses,
  resumeEntityResponses,
  resumeExportResponses,
  resumeListResponses,
  resumeQuestionGenerateResponses,
  resumeQuestionSynthesizeResponses,
  resumeScoreResponses,
  resumeUpdateResponses,
} from "./resume-route-contracts";
import {
  scraperErrorResponseSchema,
  scraperOperationResponses,
} from "./scraper-route-contracts";
import {
  searchAllResponses,
  searchAutocompleteResponses,
} from "./search-route-contracts";
import {
  apiKeysUpdateResponses,
  jobTaxonomyUpdateResponses,
  providerTestResponses,
  settingsExportResponses,
  settingsImportResponses,
  settingsReadResponses,
  settingsUpdateResponses,
} from "./settings-route-contracts";
import {
  skillAnalysisResponses,
  skillMappingCreateResponses,
  skillMappingDeleteResponses,
  skillMappingUpdateResponses,
  skillMappingsListResponses,
  skillPathwaysResponses,
  skillReadinessResponses,
} from "./skill-mapping-route-contracts";
import {
  statsCareerResponseSchema,
  statsDashboardResponseSchema,
  statsWeeklyResponseSchema,
} from "./stats-route-contracts";
import {
  studioAnalyticsResponses,
  studioDeleteResponses,
  studioEntityResponses,
  studioListResponses,
} from "./studio-route-contracts";
import { userProfileResponseSchema } from "./user-route-contracts";

export const ROUTE_RESPONSE_REGISTRY = {
  ai: {
    chat: chatRouteResponses,
    analyzeResume: analyzeResumeResponses,
    generateCoverLetter: aiGenerateCoverLetterResponses,
    matchJobs: matchJobsResponses,
    models: aiModelsResponses,
    usage: aiUsageResponses,
    automationAction: automationActionResponses,
  },
  automation: {
    run: automationRunEnvelopeBodySchema,
    capabilities: capabilityAuditReportBodySchema,
    error: routeErrorBodySchema,
    errors: automationRouteErrorResponses,
  },
  auth: {
    status: authStatusResponses,
    configured: authConfiguredResponses,
    init: authInitResponses,
  },
  coverLetters: {
    list: coverLettersListResponses,
    entity: coverLetterEntityResponses,
    delete: coverLetterDeleteResponses,
    generate: coverLetterGenerateResponses,
    export: coverLetterExportResponses,
  },
  gamification: {
    progress: gamificationProgressResponses,
    awardXp: awardXpResponses,
    achievements: achievementsResponses,
    challenges: challengesListResponses,
    completeChallenge: challengeCompleteResponses,
    weeklyProgress: weeklyProgressResponses,
    monthlyStats: monthlyStatsResponses,
  },
  interview: {
    createSession: createInterviewSessionResponses,
    listSessions: interviewSessionsListResponses,
    session: interviewSessionResponses,
    submitResponse: submitInterviewResponseResponses,
    completeSession: completeInterviewSessionResponses,
    stats: interviewStatsResponses,
  },
  jobs: {
    list: jobsListResponses,
    entity: jobEntityResponses,
    save: saveJobResponses,
    deleteSaved: deleteSavedJobResponses,
    savedList: savedJobsListResponses,
    apply: applyJobResponses,
    updateApplication: updateApplicationResponses,
    applicationsList: applicationsListResponses,
    recommendations: recommendationsResponses,
    refresh: jobsRefreshResponses,
  },
  portfolio: {
    profile: portfolioResponses,
    mutation: portfolioMutationResponses,
    projectMutation: portfolioProjectMutationResponses,
    projectReorder: portfolioProjectReorderResponses,
    projectDelete: portfolioProjectDeleteResponses,
    export: portfolioExportResponses,
  },
  resume: {
    questionGenerate: resumeQuestionGenerateResponses,
    questionSynthesize: resumeQuestionSynthesizeResponses,
    list: resumeListResponses,
    entity: resumeEntityResponses,
    create: resumeCreateResponses,
    update: resumeUpdateResponses,
    delete: resumeDeleteResponses,
    export: resumeExportResponses,
    enhance: resumeEnhanceResponses,
    score: resumeScoreResponses,
  },
  scraper: {
    operation: scraperOperationResponses,
    error: scraperErrorResponseSchema,
  },
  search: {
    all: searchAllResponses,
    autocomplete: searchAutocompleteResponses,
  },
  settings: {
    read: settingsReadResponses,
    update: settingsUpdateResponses,
    jobTaxonomyUpdate: jobTaxonomyUpdateResponses,
    apiKeysUpdate: apiKeysUpdateResponses,
    providerTest: providerTestResponses,
    export: settingsExportResponses,
    import: settingsImportResponses,
  },
  skillMapping: {
    list: skillMappingsListResponses,
    create: skillMappingCreateResponses,
    update: skillMappingUpdateResponses,
    delete: skillMappingDeleteResponses,
    pathways: skillPathwaysResponses,
    readiness: skillReadinessResponses,
    analysis: skillAnalysisResponses,
  },
  stats: {
    dashboard: { [HTTP_STATUS_OK]: statsDashboardResponseSchema },
    weekly: { [HTTP_STATUS_OK]: statsWeeklyResponseSchema },
    career: { [HTTP_STATUS_OK]: statsCareerResponseSchema },
  },
  studio: {
    list: studioListResponses,
    entity: studioEntityResponses,
    delete: studioDeleteResponses,
    analytics: studioAnalyticsResponses,
  },
  user: {
    profile: { [HTTP_STATUS_OK]: userProfileResponseSchema },
  },
} as const;
