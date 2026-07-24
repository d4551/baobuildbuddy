import { mergeLocaleCatalog } from "../merge";
import type { AppTranslationSchema } from "../en-US";
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
import jobCard from "./jobCard";
import jobDetail from "./jobDetail";
import jobsPage from "./jobsPage";
import meta from "./meta";
import nav from "./nav";
import portfolioPage from "./portfolioPage";
import portfolioProjectCard from "./portfolioProjectCard";
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

const esESCatalog = mergeLocaleCatalog<AppTranslationSchema>(
  a11y,
  aiChatCommon,
  aiChatPage,
  aiDashboard,
  aiProviderCatalog,
  apiDocs,
  apiErrors,
  app,
  automationemail,
  automationhub,
  automationjobApply,
  automationrunDetail,
  automationruns,
  automationscraper,
  common,
  confirmDialog,
  coverLetterDetailPage,
  coverLetterPage,
  dailyChallengeCard,
  dashboard,
  errorPage,
  floatingChat,
  gamificationPage,
  interviewChatComponent,
  interviewHistory,
  interviewHub,
  interviewScoreCard,
  interviewSession,
  jobCard,
  jobDetail,
  jobsPage,
  meta,
  nav,
  portfolioPage,
  portfolioProjectCard,
  quickFab,
  resumeBuildPage,
  resumePage,
  resumePreview,
  settings,
  setup,
  skillsPage,
  skillsPathwaysPage,
  studioAnalytics,
  studioDetail,
  studioSelector,
  studiosIndex,
  xpBar,
);

export default esESCatalog;
