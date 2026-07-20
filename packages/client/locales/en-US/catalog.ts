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
import jobCard from "./jobCard";
import jobDetail from "./jobDetail";
import jobsPage from "./jobsPage";
import layout from "./layout";
import meta from "./meta";
import nav from "./nav";
import portfolioPage from "./portfolioPage";
import portfolioProjectCard from "./portfolioProjectCard";
import quickFab from "./quickFab";
import resumeBuildPage from "./resumeBuildPage";
import resumeComponentEducation from "./resumeComponentEducation";
import resumeComponentExperience from "./resumeComponentExperience";
import resumeComponentPersonalInfo from "./resumeComponentPersonalInfo";
import resumeComponentSkills from "./resumeComponentSkills";
import resumePage from "./resumePage";
import resumePreview from "./resumePreview";
import settingsaiProviders from "./settings/aiProviders";
import settingsautomation from "./settings/automation";
import settingsbootstrapError from "./settings/bootstrapError";
import settingsbootstrapRetry from "./settings/bootstrapRetry";
import settingsbootstrapRetryAria from "./settings/bootstrapRetryAria";
import settingsbrand from "./settings/brand";
import settingsemailDelivery from "./settings/emailDelivery";
import settingserrors from "./settings/errors";
import settingsjobIntelligence from "./settings/jobIntelligence";
import settingspreferences from "./settings/preferences";
import settingsprofile from "./settings/profile";
import settingssaveState from "./settings/saveState";
import settingsseoDescription from "./settings/seoDescription";
import settingsseoTitle from "./settings/seoTitle";
import settingssubtitle from "./settings/subtitle";
import settingstitle from "./settings/title";
import settingstoasts from "./settings/toasts";
import setup from "./setup";
import skillsPage from "./skillsPage";
import skillsPathwaysPage from "./skillsPathwaysPage";
import studioAnalytics from "./studioAnalytics";
import studioDetail from "./studioDetail";
import studioSelector from "./studioSelector";
import studiosIndex from "./studiosIndex";
import workspaceSearch from "./workspaceSearch";
import xpBar from "./xpBar";

type EnglishLocaleCatalog = typeof meta &
  typeof app &
  typeof common &
  typeof a11y &
  typeof layout &
  typeof apiErrors &
  typeof confirmDialog &
  typeof errorPage &
  typeof nav &
  typeof apiDocs &
  typeof dashboard &
  typeof gamificationPage &
  typeof jobsPage &
  typeof jobCard &
  typeof resumePreview &
  typeof skillsPage &
  typeof skillsPathwaysPage &
  typeof resumePage &
  typeof resumeBuildPage &
  typeof coverLetterPage &
  typeof coverLetterDetailPage &
  typeof portfolioPage &
  typeof portfolioProjectCard &
  typeof interviewChatComponent &
  typeof interviewScoreCard &
  typeof dailyChallengeCard &
  typeof xpBar &
  typeof resumeComponentPersonalInfo &
  typeof resumeComponentExperience &
  typeof resumeComponentEducation &
  typeof resumeComponentSkills &
  typeof jobDetail &
  typeof studioDetail &
  typeof studiosIndex &
  typeof studioAnalytics &
  typeof automationhub &
  typeof automationruns &
  typeof automationjobApply &
  typeof automationemail &
  typeof automationrunDetail &
  typeof automationscraper &
  typeof aiProviderCatalog &
  typeof setup &
  typeof aiDashboard &
  typeof interviewHistory &
  typeof interviewHub &
  typeof interviewSession &
  typeof settingsseoTitle &
  typeof settingsseoDescription &
  typeof settingstitle &
  typeof settingssubtitle &
  typeof settingsbootstrapError &
  typeof settingsbootstrapRetry &
  typeof settingsbootstrapRetryAria &
  typeof settingssaveState &
  typeof settingsprofile &
  typeof settingspreferences &
  typeof settingsautomation &
  typeof settingsjobIntelligence &
  typeof settingsemailDelivery &
  typeof settingsaiProviders &
  typeof settingsbrand &
  typeof settingstoasts &
  typeof settingserrors &
  typeof quickFab &
  typeof floatingChat &
  typeof studioSelector &
  typeof aiChatPage &
  typeof aiChatCommon &
  typeof workspaceSearch;

const enUSCatalog = mergeLocaleCatalog<EnglishLocaleCatalog>(
  meta,
  app,
  common,
  a11y,
  layout,
  apiErrors,
  confirmDialog,
  errorPage,
  nav,
  apiDocs,
  dashboard,
  gamificationPage,
  jobsPage,
  jobCard,
  resumePreview,
  skillsPage,
  skillsPathwaysPage,
  resumePage,
  resumeBuildPage,
  coverLetterPage,
  coverLetterDetailPage,
  portfolioPage,
  portfolioProjectCard,
  interviewChatComponent,
  interviewScoreCard,
  dailyChallengeCard,
  xpBar,
  resumeComponentPersonalInfo,
  resumeComponentExperience,
  resumeComponentEducation,
  resumeComponentSkills,
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
  settingsseoTitle,
  settingsseoDescription,
  settingstitle,
  settingssubtitle,
  settingsbootstrapError,
  settingsbootstrapRetry,
  settingsbootstrapRetryAria,
  settingssaveState,
  settingsprofile,
  settingspreferences,
  settingsautomation,
  settingsjobIntelligence,
  settingsemailDelivery,
  settingsaiProviders,
  settingsbrand,
  settingstoasts,
  settingserrors,
  quickFab,
  floatingChat,
  studioSelector,
  aiChatPage,
  aiChatCommon,
  workspaceSearch,
);

export default enUSCatalog;
