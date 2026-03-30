import { buildDeterministicQuestionSet } from "./ai-deterministic-provider-interview";

const buildDeterministicFeedback = (): string =>
  JSON.stringify({
    score: 78,
    feedback: "Clear structured response with actionable detail.",
    strengths: ["Structured explanation", "Relevant technical context"],
    improvements: ["Add one measurable outcome"],
  });

const buildDeterministicFinalAnalysis = (): string =>
  JSON.stringify({
    overallScore: 80,
    strengths: ["Clear communication", "Practical technical reasoning"],
    improvements: ["Provide deeper metric context"],
    recommendations: ["Continue using STAR-style response framing"],
    feedback: "Consistent and production-ready interview performance.",
  });

const buildDeterministicCvQuestionnaire = (): string =>
  JSON.stringify([
    {
      id: "personal-name",
      question: "What name and preferred contact details should appear on your resume?",
      category: "personal",
    },
    {
      id: "summary-impact",
      question: "What kind of gameplay impact or player-facing outcomes are you most proud of?",
      category: "summary",
    },
    {
      id: "experience-role",
      question:
        "Which game-industry roles, teams, or shipped features best represent your experience?",
      category: "experience",
    },
    {
      id: "skills-stack",
      question: "Which tools, engines, or programming languages do you rely on most often?",
      category: "skills",
    },
  ]);

const buildDeterministicSynthesizedResume = (): string =>
  JSON.stringify({
    personalInfo: {
      name: "Test Candidate",
      email: "candidate@example.test",
      phone: "",
      location: "Remote",
      linkedIn: "",
      portfolio: "https://portfolio.example.test",
    },
    summary:
      "Gameplay-focused developer with a track record of shipping player-facing systems and collaborating with cross-functional teams.",
    experience: [
      {
        title: "Gameplay Programmer",
        company: "Test Studio",
        startDate: "2023",
        endDate: "Present",
        location: "Remote",
        description: "Built and tuned combat and progression systems for a live game.",
        achievements: [
          "Shipped feature updates with designers and QA",
          "Improved iteration speed with tooling automation",
        ],
      },
    ],
    education: [
      {
        degree: "BSc",
        field: "Computer Science",
        school: "Test University",
        year: "2022",
        gpa: "",
      },
    ],
    skills: {
      technical: ["TypeScript", "Bun", "Gameplay Systems"],
      soft: ["Collaboration", "Communication"],
      gaming: ["Combat Design", "Live Ops"],
    },
    projects: [
      {
        title: "Combat Sandbox",
        description: "Prototype focused on encounter pacing and enemy readability.",
        technologies: ["Bun", "TypeScript"],
        link: "https://portfolio.example.test/projects/combat-sandbox",
      },
    ],
    gamingExperience: {
      gameEngines: "Unreal Engine, Unity",
      platforms: "PC, Console",
      genres: "Action RPG, Co-op Shooter",
      shippedTitles: "1 released title",
    },
  });

const buildDeterministicCoverLetterContent = (): string =>
  JSON.stringify({
    introduction:
      "I am excited to apply for this role because it aligns with the kind of systems-driven game development work I enjoy most.",
    body: "My recent work has focused on building player-facing gameplay systems, collaborating closely with designers, and turning feedback into polished features that ship reliably.",
    conclusion:
      "I would welcome the chance to contribute that same product-minded approach to your team.",
  });

const buildDeterministicScrapeEnrichment = (): string =>
  JSON.stringify({
    summary:
      "The posting emphasizes hands-on delivery, cross-functional collaboration, and practical ownership in a live game environment.",
    hiringSignals: [
      "Team values shipping velocity and execution reliability",
      "Role expects direct collaboration with adjacent disciplines",
    ],
    interviewFocusAreas: [
      "Player-facing system ownership",
      "Cross-functional delivery tradeoffs",
      "Live-ops or iteration workflow",
    ],
    candidatePitchAngles: [
      "Highlight shipped gameplay or production outcomes",
      "Show how tooling or process improvements improved delivery",
    ],
  });

export const buildDeterministicContent = (prompt: string): string => {
  const normalizedPrompt = prompt.toLowerCase();

  if (
    normalizedPrompt.includes("generate 8-12 interview-style questions") &&
    normalizedPrompt.includes("return a json array")
  ) {
    return buildDeterministicCvQuestionnaire();
  }

  if (
    normalizedPrompt.includes("structured resume (resumedata) json object") ||
    normalizedPrompt.includes("return only valid json matching this structure")
  ) {
    return buildDeterministicSynthesizedResume();
  }

  if (
    normalizedPrompt.includes('"overallscore": 0-100') &&
    normalizedPrompt.includes('"recommendations"')
  ) {
    return buildDeterministicFinalAnalysis();
  }

  if (
    normalizedPrompt.includes('"score": 0-100') &&
    normalizedPrompt.includes('"strengths"') &&
    normalizedPrompt.includes('"improvements"')
  ) {
    return buildDeterministicFeedback();
  }

  if (
    normalizedPrompt.includes("return strict json array only") &&
    normalizedPrompt.includes("interview")
  ) {
    return buildDeterministicQuestionSet(prompt);
  }

  if (
    normalizedPrompt.includes("write a compelling cover letter") &&
    normalizedPrompt.includes("respond with a json object containing three fields")
  ) {
    return buildDeterministicCoverLetterContent();
  }

  if (
    normalizedPrompt.includes("return strict json object only for scrape enrichment") &&
    normalizedPrompt.includes('"candidatepitchangles"')
  ) {
    return buildDeterministicScrapeEnrichment();
  }

  return "Deterministic test response.";
};
