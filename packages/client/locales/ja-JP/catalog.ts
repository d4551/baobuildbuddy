import type { AppTranslationOverrides } from "../en-US";
import { mergeLocaleCatalog } from "../merge";
import a11y from "./a11y";
import aiChatCommon from "./aiChatCommon";
import aiChatPage from "./aiChatPage";
import aiDashboard from "./aiDashboard";
import aiProviderCatalog from "./aiProviderCatalog";
import apiDocs from "./apiDocs";
import app from "./app";
import automation from "./automation";
import common from "./common";
import confirmDialog from "./confirmDialog";
import coverLetterPage from "./coverLetterPage";
import dailyChallengeCard from "./dailyChallengeCard";
import dashboard from "./dashboard";
import errorPage from "./errorPage";
import gamificationPage from "./gamificationPage";
import interviewHistory from "./interviewHistory";
import interviewHub from "./interviewHub";
import interviewScoreCard from "./interviewScoreCard";
import interviewSession from "./interviewSession";
import jobsPage from "./jobsPage";
import meta from "./meta";
import nav from "./nav";
import portfolioPage from "./portfolioPage";
import quickFab from "./quickFab";
import resumeBuildPage from "./resumeBuildPage";
import resumePage from "./resumePage";
import resumePreview from "./resumePreview";
import settings from "./settings";
import setup from "./setup";
import skillsPage from "./skillsPage";
import skillsPathwaysPage from "./skillsPathwaysPage";
import studioAnalytics from "./studioAnalytics";
import studioDetail from "./studioDetail";
import studioSelector from "./studioSelector";
import studiosIndex from "./studiosIndex";

/**
 * ja-JP override catalog, assembled from per-namespace modules so no single
 * locale file exceeds the module size ceiling. Missing keys fall back to en-US.
 */
const catalog = mergeLocaleCatalog<AppTranslationOverrides>(
  meta,
  app,
  common,
  a11y,
  confirmDialog,
  errorPage,
  nav,
  apiDocs,
  dashboard,
  gamificationPage,
  jobsPage,
  resumePreview,
  skillsPage,
  skillsPathwaysPage,
  resumePage,
  resumeBuildPage,
  coverLetterPage,
  portfolioPage,
  interviewScoreCard,
  dailyChallengeCard,
  studioDetail,
  studiosIndex,
  studioAnalytics,
  automation,
  aiProviderCatalog,
  setup,
  interviewHistory,
  interviewHub,
  interviewSession,
  settings,
  quickFab,
  studioSelector,
  aiDashboard,
  aiChatPage,
  aiChatCommon,
);

export default catalog;
