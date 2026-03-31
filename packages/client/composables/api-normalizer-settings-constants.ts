import type { AutomationSettings, JobTaxonomySettings } from "@bao/shared";

export const SPEECH_AUDIO_FORMATS: readonly AutomationSettings["speech"]["tts"]["format"][] = [
  "mp3",
  "wav",
];

export const COMPANY_BOARD_ATS_TYPES: readonly AutomationSettings["jobProviders"]["companyBoards"][number]["type"][] =
  [
    "greenhouse",
    "lever",
    "recruitee",
    "workable",
    "ashby",
    "smartrecruiters",
    "teamtailor",
    "workday",
  ];

export const GAMING_PORTAL_IDS: readonly AutomationSettings["jobProviders"]["gamingPortals"][number]["id"][] =
  ["hitmarker", "grackle", "workwithindies", "remotegamejobs", "gamesjobsdirect", "pocketgamer"];

export const COMPANY_BOARD_TEMPLATE_KEYS = [
  "greenhouse",
  "lever",
  "recruitee",
  "workable",
  "ashby",
  "smartrecruiters",
  "teamtailor",
  "workday",
] as const;

export const JOB_TAXONOMY_CATEGORIES: readonly JobTaxonomySettings["keywords"][number]["category"][] =
  ["remote-location", "hybrid-location", "requirement", "technology", "genre", "platform", "role"];

export const JOB_TAXONOMY_STUDIO_TYPES: readonly JobTaxonomySettings["studioRules"][number]["studioType"][] =
  ["AAA", "Indie", "Mobile", "VR/AR", "Platform", "Esports", "Unknown"];
