import { type BrandSettings, type ScrapedJob, type ScrapedStudio } from "@bao/shared";
/**
 * AI prompt templates specialized for video game industry career guidance.
 */
type BrandPromptIdentity = Pick<BrandSettings, "name" | "assistantName">;
/**
 * Builds the primary career-assistant system prompt for a brand identity.
 *
 * @param brand Brand identity presented to the end user.
 * @returns Fully rendered system prompt.
 */
export declare function buildSystemPrompt(brand: BrandPromptIdentity): string;
/**
 * Core system prompt defining the default assistant personality and expertise.
 */
export declare const SYSTEM_PROMPT: string;
/**
 * Resume enhancement prompt
 */
export declare function resumeEnhancePrompt(resume: string, jobDescription?: string): string;
/**
 * Resume scoring prompt
 */
export declare function resumeScorePrompt(resume: string, jobDescription: string): string;
/**
 * Cover letter generation prompt
 */
export declare function coverLetterPrompt(company: string, position: string, jobInfo: string, resumeContext: string): string;
/**
 * Email response generation prompt for automation email workflows.
 */
export declare function emailResponsePrompt(subject: string, message: string, tone: "professional" | "friendly" | "concise", sender?: string): string;
/**
 * Job match analysis prompt
 */
export declare function jobMatchPrompt(userProfile: {
    skills: string[];
    experience: string;
    goals: string;
}, job: {
    title: string;
    company: string;
    description: string;
    requirements: string[];
}): string;
/**
 * Interview question generation prompt
 */
export declare function interviewQuestionPrompt(studio: string, role: string, level: "entry" | "mid" | "senior" | "lead"): string;
/**
 * Interview response feedback prompt
 */
export declare function interviewFeedbackPrompt(question: string, response: string): string;
/**
 * Scrape enrichment prompt for a normalized scraped job row.
 */
export declare function scrapeJobEnrichmentPrompt(job: ScrapedJob): string;
/**
 * Scrape enrichment prompt for a normalized scraped studio row.
 */
export declare function scrapeStudioEnrichmentPrompt(studio: ScrapedStudio): string;
/**
 * Skills analysis and mapping prompt
 */
export declare function skillAnalysisPrompt(skills: string[]): string;
/**
 * Portfolio review prompt
 */
export declare function portfolioReviewPrompt(portfolioDescription: string, targetRole: string): string;
/**
 * Company research prompt
 */
export declare function companyResearchPrompt(companyName: string): string;
/**
 * Salary negotiation guidance prompt
 */
export declare function salaryNegotiationPrompt(role: string, level: string, location: string, offer?: number): string;
/**
 * Career transition prompt
 */
export declare function careerTransitionPrompt(currentField: string, targetRole: string, transferableSkills: string[]): string;
/**
 * Resume bullet quantification prompt
 */
export declare function resumeQuantifyPrompt(bulletPoint: string, sectionType: string, jobContext?: string): string;
/**
 * Cover letter customization for company culture
 */
export declare function coverLetterCustomizePrompt(template: string, company: string, culture: string[], relevantExperience: string): string;
/**
 * Interview persona prompt for AI roleplaying as interviewer
 */
interface InterviewPersonaPromptInput {
    role: string;
    company: string;
    personality: string;
    interviewStyle: string;
    focusAreas: string[];
}
export declare function interviewPersonaPrompt({ role, company, personality, interviewStyle, focusAreas, }: InterviewPersonaPromptInput): string;
/**
 * Interview follow-up question prompt
 */
export declare function interviewFollowUpPrompt(question: string, response: string, previousQuestions: string[]): string;
/**
 * Portfolio project description generator
 */
export declare function portfolioDescriptionPrompt(title: string, technologies: string[], role: string, outcomes?: string): string;
/**
 * Skill gap analysis prompt
 */
export declare function skillGapPrompt(userSkills: string[], targetRole: string, targetCompany?: string): string;
/**
 * Skill categorization prompt for gaming-to-career mapping
 */
export declare function skillCategorizePrompt(gamingExperiences: string[]): string;
/**
 * CV questionnaire: generate questions based on target role/studio
 */
export declare function cvQuestionnaireQuestionsPrompt(targetRole: string, studioName?: string, experienceLevel?: string): string;
/**
 * CV questionnaire: synthesize answers into ResumeData JSON
 */
export declare function cvQuestionnaireSynthesizePrompt(questionsAndAnswers: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
}>): string;
/**
 * Builds domain-specific system prompts for contextual AI conversations.
 *
 * @param brand Brand identity presented to the end user.
 * @returns Domain prompt map keyed by chat domain.
 */
export declare function buildDomainSystemPrompts(brand: BrandPromptIdentity): Record<string, string>;
/**
 * Domain-specific system prompts for contextual AI conversations.
 */
export declare const DOMAIN_SYSTEM_PROMPTS: Record<string, string>;
/**
 * Form field analysis prompt for AI-powered smart selectors in RPA automation.
 * Analyzes a job application page's HTML to map field names to selectors and infer answers.
 */
export declare function formFieldAnalysisPrompt(pageHtml: string, fieldsNeeded: string[], candidateContext: string): string;
/**
 * Gaming industry context constant for prompt injection
 */
export declare const GAMING_INDUSTRY_CONTEXT = "Gaming Industry Context:\nEngines: Unity, Unreal Engine 5, Godot 4, CryEngine, id Tech, Frostbite, Source 2, RPG Maker, GameMaker, Ren'Py\nPlatforms: PC (Steam/Epic), PlayStation 5, Xbox Series X|S, Nintendo Switch, Mobile (iOS/Android), VR (Meta Quest/PSVR2), Web (WebGL/HTML5)\nGenres: Action, Adventure, RPG, FPS, TPS, Strategy (RTS/TBS), MOBA, Battle Royale, Simulation, Sports, Racing, Fighting, Horror, Puzzle, Platformer, MMO, Sandbox, Visual Novel, Roguelike, Metroidvania, Idle/Clicker\nRoles: Game Designer, Level Designer, Systems Designer, Narrative Designer, Gameplay Programmer, Engine Programmer, Graphics Programmer, AI Programmer, Network Programmer, Tools Programmer, Technical Artist, Concept Artist, 3D Modeler, Animator, VFX Artist, Environment Artist, Character Artist, UI/UX Designer, Sound Designer, Music Composer, Producer, Associate Producer, QA Tester, QA Lead, Community Manager, DevOps Engineer, Build Engineer, Localization Specialist, Data Analyst, Live Ops Manager, Monetization Designer\nTransferable Skills: Leadership, Project Management, Agile/Scrum, Communication, Problem Solving, Analytics, UX Research, Quality Assurance, Technical Writing, Team Coordination, Deadline Management, Cross-functional Collaboration";
export {};
