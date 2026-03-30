import type { AIChatContextDomain } from "@bao/shared";

const DOMAIN_FOLLOW_UPS: Record<AIChatContextDomain, string[]> = {
  resume: [
    "Can you help me improve my summary section?",
    "What skills should I highlight for this role?",
    "How can I quantify my achievements better?",
  ],
  job_search: [
    "What studios are hiring for my skills?",
    "How does my profile match this role?",
    "What salary should I expect?",
  ],
  interview: [
    "Give me a practice question for this role",
    "How should I answer behavioral questions?",
    "What questions should I ask the interviewer?",
  ],
  portfolio: [
    "How can I improve my project descriptions?",
    "What projects should I add to stand out?",
    "How should I organize my portfolio?",
  ],
  skills: [
    "What skills am I missing for this career path?",
    "How do my gaming skills translate professionally?",
    "What should I learn next?",
  ],
  automation: [
    "What's the status of my last application?",
    "Show my automation run history",
    "Apply to another job",
  ],
  general: [
    "Help me with my resume",
    "Find jobs that match my profile",
    "Prepare me for an interview",
  ],
};

export const getContextManagerFollowUps = (domain: AIChatContextDomain): string[] =>
  DOMAIN_FOLLOW_UPS[domain] || DOMAIN_FOLLOW_UPS.general;
