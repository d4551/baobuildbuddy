import type { BrandPromptIdentity } from "./prompt-contracts";
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
 * Gaming industry context constant for prompt injection
 */
export declare const GAMING_INDUSTRY_CONTEXT = "Gaming Industry Context:\nEngines: Unity, Unreal Engine 5, Godot 4, CryEngine, id Tech, Frostbite, Source 2, RPG Maker, GameMaker, Ren'Py\nPlatforms: PC (Steam/Epic), PlayStation 5, Xbox Series X|S, Nintendo Switch, Mobile (iOS/Android), VR (Meta Quest/PSVR2), Web (WebGL/HTML5)\nGenres: Action, Adventure, RPG, FPS, TPS, Strategy (RTS/TBS), MOBA, Battle Royale, Simulation, Sports, Racing, Fighting, Horror, Puzzle, Platformer, MMO, Sandbox, Visual Novel, Roguelike, Metroidvania, Idle/Clicker\nRoles: Game Designer, Level Designer, Systems Designer, Narrative Designer, Gameplay Programmer, Engine Programmer, Graphics Programmer, AI Programmer, Network Programmer, Tools Programmer, Technical Artist, Concept Artist, 3D Modeler, Animator, VFX Artist, Environment Artist, Character Artist, UI/UX Designer, Sound Designer, Music Composer, Producer, Associate Producer, QA Tester, QA Lead, Community Manager, DevOps Engineer, Build Engineer, Localization Specialist, Data Analyst, Live Ops Manager, Monetization Designer\nTransferable Skills: Leadership, Project Management, Agile/Scrum, Communication, Problem Solving, Analytics, UX Research, Quality Assurance, Technical Writing, Team Coordination, Deadline Management, Cross-functional Collaboration";
