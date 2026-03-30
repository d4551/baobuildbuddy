/**
 * AI prompt templates specialized for video game industry career guidance.
 */

export type { BrandPromptIdentity, InterviewPersonaPromptInput } from "./prompt-contracts";
export {
  buildDomainSystemPrompts,
  buildSystemPrompt,
  DOMAIN_SYSTEM_PROMPTS,
  GAMING_INDUSTRY_CONTEXT,
  SYSTEM_PROMPT,
} from "./prompts-system";
export {
  coverLetterCustomizePrompt,
  coverLetterPrompt,
  resumeEnhancePrompt,
  resumeQuantifyPrompt,
  resumeScorePrompt,
} from "./prompts-resume";
export {
  interviewFeedbackPrompt,
  interviewFollowUpPrompt,
  interviewPersonaPrompt,
  interviewQuestionPrompt,
} from "./prompts-interview";
export { scrapeJobEnrichmentPrompt, scrapeStudioEnrichmentPrompt } from "./prompts-scrape";
export {
  careerTransitionPrompt,
  companyResearchPrompt,
  emailResponsePrompt,
  jobMatchPrompt,
  portfolioDescriptionPrompt,
  portfolioReviewPrompt,
  salaryNegotiationPrompt,
  skillAnalysisPrompt,
  skillCategorizePrompt,
  skillGapPrompt,
} from "./prompts-career";
export {
  cvQuestionnaireQuestionsPrompt,
  cvQuestionnaireSynthesizePrompt,
} from "./prompts-cv";
export { formFieldAnalysisPrompt } from "./prompts-automation";
