import { mergeLocaleCatalog } from "../merge";
import meta from "./meta";
import app from "./app";
import common from "./common";
import a11y from "./a11y";
import layout from "./layout";
import apiErrors from "./apiErrors";
import confirmDialog from "./confirmDialog";
import errorPage from "./errorPage";
import nav from "./nav";
import apiDocs from "./apiDocs";
import dashboard from "./dashboard";
import gamificationPage from "./gamificationPage";
import jobsPage from "./jobsPage";
import jobCard from "./jobCard";
import resumePreview from "./resumePreview";
import skillsPage from "./skillsPage";
import skillsPathwaysPage from "./skillsPathwaysPage";
import resumePage from "./resumePage";
import resumeBuildPage from "./resumeBuildPage";
import coverLetterPage from "./coverLetterPage";
import coverLetterDetailPage from "./coverLetterDetailPage";
import portfolioPage from "./portfolioPage";
import portfolioProjectCard from "./portfolioProjectCard";
import interviewChatComponent from "./interviewChatComponent";
import interviewScoreCard from "./interviewScoreCard";
import dailyChallengeCard from "./dailyChallengeCard";
import xpBar from "./xpBar";
import resumeComponentPersonalInfo from "./resumeComponentPersonalInfo";
import resumeComponentExperience from "./resumeComponentExperience";
import resumeComponentEducation from "./resumeComponentEducation";
import resumeComponentSkills from "./resumeComponentSkills";
import jobDetail from "./jobDetail";
import studioDetail from "./studioDetail";
import studiosIndex from "./studiosIndex";
import studioAnalytics from "./studioAnalytics";
import automationhub from "./automation/hub";
import automationruns from "./automation/runs";
import automationjobApply from "./automation/jobApply";
import automationemail from "./automation/email";
import automationrunDetail from "./automation/runDetail";
import automationscraper from "./automation/scraper";
import aiProviderCatalog from "./aiProviderCatalog";
import setup from "./setup";
import aiDashboard from "./aiDashboard";
import interviewHistory from "./interviewHistory";
import interviewHub from "./interviewHub";
import interviewSession from "./interviewSession";
import settingsseoTitle from "./settings/seoTitle";
import settingsseoDescription from "./settings/seoDescription";
import settingstitle from "./settings/title";
import settingssubtitle from "./settings/subtitle";
import settingsbootstrapError from "./settings/bootstrapError";
import settingsbootstrapRetry from "./settings/bootstrapRetry";
import settingsbootstrapRetryAria from "./settings/bootstrapRetryAria";
import settingssaveState from "./settings/saveState";
import settingsprofile from "./settings/profile";
import settingspreferences from "./settings/preferences";
import settingsautomation from "./settings/automation";
import settingsjobIntelligence from "./settings/jobIntelligence";
import settingsemailDelivery from "./settings/emailDelivery";
import settingsaiProviders from "./settings/aiProviders";
import settingsbrand from "./settings/brand";
import settingstoasts from "./settings/toasts";
import settingserrors from "./settings/errors";
import quickFab from "./quickFab";
import floatingChat from "./floatingChat";
import studioSelector from "./studioSelector";
import aiChatPage from "./aiChatPage";
import aiChatCommon from "./aiChatCommon";

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
  typeof aiChatCommon;

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
);

export default enUSCatalog;
