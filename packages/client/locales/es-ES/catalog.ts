import type { AppTranslationOverrides } from "../en-US";
import { mergeLocaleCatalog } from "../merge";
import a11y from "./a11y";
import aiChatCommon from "./aiChatCommon";
import aiChatPage from "./aiChatPage";
import aiDashboard from "./aiDashboard";
import aiProviderCatalog from "./aiProviderCatalog";
import apiDocs from "./apiDocs";
import apiErrors from "./apiErrors";
import app from "./app";
import automationemail from "./automation/email";
import automationhub from "./automation/hub";
import automationjobApply from "./automation/jobApply";
import automationrunDetail from "./automation/runDetail";
import automationruns from "./automation/runs";
import automationscraper from "./automation/scraper";
import common from "./common";
import confirmDialog from "./confirmDialog";
import coverLetterDetailPage from "./coverLetterDetailPage";
import coverLetterPage from "./coverLetterPage";
import dailyChallengeCard from "./dailyChallengeCard";
import dashboard from "./dashboard";
import errorPage from "./errorPage";
import floatingChat from "./floatingChat";
import gamificationPage from "./gamificationPage";
import interviewChatComponent from "./interviewChatComponent";
import interviewHistory from "./interviewHistory";
import interviewHub from "./interviewHub";
import interviewScoreCard from "./interviewScoreCard";
import interviewSession from "./interviewSession";
import jobDetail from "./jobDetail";
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
import xpBar from "./xpBar";

/**
 * es-ES override catalog, assembled from per-namespace modules so no single
 * locale file exceeds the module size ceiling. Missing keys fall back to en-US.
 */
const catalog = mergeLocaleCatalog<AppTranslationOverrides>(
  meta,
  app,
  common,
  a11y,
  apiErrors,
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
  coverLetterDetailPage,
  portfolioPage,
  interviewChatComponent,
  interviewScoreCard,
  dailyChallengeCard,
  xpBar,
  jobDetail,
  studioDetail,
  studiosIndex,
  studioAnalytics,
  automationhub,
  automationruns,
  automationjobApply,
  automationemail,
  automationrunDetail,
  automationscraper,
  aiProviderCatalog,
  setup,
  aiDashboard,
  interviewHistory,
  interviewHub,
  interviewSession,
  settings,
  quickFab,
  floatingChat,
  studioSelector,
  aiChatPage,
  aiChatCommon,
);

export default catalog;
