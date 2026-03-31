import type { Database } from "bun:sqlite";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { eq } from "drizzle-orm";
import type * as schema from "./db/schema/schema-modules";

/** AI-backed interview tests require additional headroom for cold-start provider calls. */
const INTERVIEW_TEST_TIMEOUT_MS = 15_000;
setDefaultTimeout(INTERVIEW_TEST_TIMEOUT_MS);

import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import type { InterviewResponse, InterviewSession } from "@bao/shared/types/interview";
import { coverLetters } from "./db/schema/cover-letters";
import { portfolioProjects, portfolios } from "./db/schema/portfolios";
import { resumes } from "./db/schema/resumes";
import type { AppRequestHandler } from "./test-utils";
import { requestJson } from "./test-utils";

interface TestHarness {
  app: AppRequestHandler;
  sqlite: Database;
  db: BunSQLiteDatabase<typeof schema>;
  interviewService: {
    startSession(studioId: string, rawConfig?: Record<string, unknown>): Promise<InterviewSession>;
    addResponse(sessionId: string, response: InterviewResponse): Promise<InterviewSession | null>;
    getSession(id: string): Promise<InterviewSession | null>;
  };
}

async function createTestHarness(): Promise<TestHarness> {
  const dbModule = await import("./db/client");
  const interviewServiceModule = await import("./services/interview-service");
  const initModule = await import("./db/init");
  const routesModule = await import("./routes/interview.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  const seedModule = await import("./db/seed");
  seedModule.seedDatabase(dbModule.db);

  const app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.interviewRoutes);

  return {
    app,
    db: dbModule.db,
    sqlite: dbModule.sqlite,
    interviewService: interviewServiceModule.interviewService,
  };
}

let harness: TestHarness;
const INTERVIEW_SESSIONS_ENDPOINT = `${API_ENDPOINT_PREFIX}/interview/sessions`;

const buildInterviewResponseEndpoint = (sessionId: string): string =>
  `${INTERVIEW_SESSIONS_ENDPOINT}/${sessionId}/response`;

function clearInterviewCandidateFixtures(): void {
  harness.sqlite.exec("DELETE FROM portfolio_projects WHERE id LIKE 'portfolio-project-%'");
  harness.sqlite.exec("DELETE FROM portfolios WHERE id LIKE 'portfolio-%'");
  harness.sqlite.exec("DELETE FROM cover_letters WHERE id LIKE 'cover-letter-%'");
  harness.sqlite.exec("DELETE FROM resumes WHERE id LIKE 'resume-%'");
}

beforeAll(async () => {
  harness = await createTestHarness();
});

beforeEach(() => {
  harness.sqlite.exec("DELETE FROM interview_sessions");
  clearInterviewCandidateFixtures();
});

afterAll(() => {});

afterEach(() => {
  clearInterviewCandidateFixtures();
});

function createCandidateFixtureIds() {
  const suffix = Date.now().toString();
  return {
    resumeId: `resume-${suffix}`,
    coverLetterId: `cover-letter-${suffix}`,
    portfolioId: `portfolio-${suffix}`,
    portfolioProjectId: `portfolio-project-${suffix}`,
  };
}

async function insertCandidateFixtures(
  ids: ReturnType<typeof createCandidateFixtureIds>,
): Promise<void> {
  await harness.db.insert(resumes).values({
    id: ids.resumeId,
    name: "Interview Context Resume",
    summary: "Candidate summary for interview-context testing.",
    personalInfo: {
      name: "Interview Candidate",
      email: "candidate@example.test",
      location: "Remote",
    },
    experience: [
      {
        title: "Gameplay Engineer",
        company: "Test Studio",
        achievements: ["Shipped live-ops features", "Improved tooling throughput"],
      },
    ],
    projects: [
      {
        title: "Combat Sandbox",
        description: "Built encounter systems and telemetry dashboards.",
      },
    ],
    isDefault: true,
  });

  await harness.db.insert(coverLetters).values({
    id: ids.coverLetterId,
    company: "Riot Games",
    position: "Gameplay Engineer",
    jobInfo: {
      tone: "collaborative",
    },
    content: {
      body: "I connect player impact with measurable engineering outcomes.",
    },
  });

  await harness.db.insert(portfolios).values({
    id: ids.portfolioId,
    metadata: {
      tagline: "Systems-focused portfolio",
    },
  });

  await harness.db.insert(portfolioProjects).values({
    id: ids.portfolioProjectId,
    portfolioId: ids.portfolioId,
    title: "Live Service Tooling",
    description: "Created internal dashboards and performance observability workflows.",
    technologies: ["TypeScript", "Bun", "SQLite"],
    featured: true,
  });
}

async function seedCandidateAssets() {
  const ids = createCandidateFixtureIds();
  await insertCandidateFixtures(ids);
  return {
    resumeId: ids.resumeId,
    coverLetterId: ids.coverLetterId,
    portfolioId: ids.portfolioId,
  };
}

function registerInterviewSessionDefaultsTest(): void {
  test("startSession applies config defaults and avoids technical questions when disabled", async () => {
    const created = await harness.interviewService.startSession("riot-games", {
      questionCount: 3,
      conversationStyle: "structured",
      includeTechnical: false,
    });

    expect(created.status).toBe("active");
    expect(created.config.focusAreas).toEqual(["architecture", "collaboration", "problem-solving"]);
    expect(created.questions).toHaveLength(3);
    expect(created.questions.every((entry) => entry.type !== "technical")).toBe(true);
    expect(created.currentQuestionIndex).toBe(0);

    const persisted = await harness.interviewService.getSession(created.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.totalQuestions).toBe(3);
  });
}

function registerNaturalInterviewSessionTest(): void {
  test("startSession keeps natural interviews asset-aware and starts with one contextual question", async () => {
    const candidateAssets = await seedCandidateAssets();

    const created = await harness.interviewService.startSession("riot-games", {
      questionCount: 3,
      conversationStyle: "natural",
      roleType: "Gameplay Engineer",
      candidateContext: candidateAssets,
    });

    expect(created.config.conversationStyle).toBe("natural");
    expect(created.config.candidateContext).toEqual(candidateAssets);
    expect(created.questions).toHaveLength(1);
    expect(created.questions[0]?.question).toContain("Gameplay Engineer");
    expect(created.questions[0]?.question).toContain("Riot Games");

    const persisted = await harness.interviewService.getSession(created.id);
    expect(persisted?.config.conversationStyle).toBe("natural");
    expect(persisted?.config.candidateContext).toEqual(candidateAssets);
    expect(persisted?.questions).toHaveLength(1);
  });
}

function registerInterviewCompletionTests(): void {
  test("addResponse stores AI feedback, completes session, and writes final analysis", async () => {
    const created = await harness.interviewService.startSession("electronic-arts", {
      questionCount: 1,
    });
    const firstQuestionId = created.questions[0]?.id;
    expect(firstQuestionId).toBeDefined();

    const response: InterviewResponse = {
      questionId: firstQuestionId,
      transcript:
        "I built a robust architecture by breaking the system into deterministic services, adding robust telemetry, and measuring each service-level latency.",
      duration: 540,
      timestamp: Date.now(),
      confidence: 0.9,
    };

    const completed = await harness.interviewService.addResponse(created.id, response);
    expect(completed).not.toBeNull();
    expect(completed?.status).toBe("completed");
    expect(completed?.responses).toHaveLength(1);
    expect(completed?.responses.at(0)?.aiAnalysis).toBeDefined();
    expect(completed?.finalAnalysis).toBeDefined();
  });

  test("addResponse returns null for missing sessions", async () => {
    const missing = await harness.interviewService.addResponse("missing-session", {
      questionId: "q-missing",
      transcript: "No session for this id.",
      duration: 120,
      timestamp: Date.now(),
      confidence: 0.8,
    });

    expect(missing).toBeNull();
  });
}

function registerInterviewNaturalFollowUpTest(): void {
  test("addResponse appends the next natural follow-up question until the configured count is reached", async () => {
    const candidateAssets = await seedCandidateAssets();
    const created = await harness.interviewService.startSession("riot-games", {
      questionCount: 2,
      conversationStyle: "natural",
      roleType: "Gameplay Engineer",
      candidateContext: candidateAssets,
    });
    const firstQuestion = created.questions[0];
    expect(firstQuestion?.id).toBeDefined();

    const updated = await harness.interviewService.addResponse(created.id, {
      questionId: firstQuestion?.id ?? "",
      transcript:
        "I translate ambiguous design goals into observable engineering milestones and align partners on measurable player outcomes.",
      duration: 420,
      timestamp: Date.now(),
      confidence: 0.85,
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("active");
    expect(updated?.responses).toHaveLength(1);
    expect(updated?.questions).toHaveLength(2);
    expect(updated?.questions[1]?.id).not.toBe(firstQuestion?.id);
    expect(updated?.questions[1]?.question).toContain("Gameplay Engineer");
    expect(updated?.currentQuestionIndex).toBe(1);
  });
}

describe("interview service", () => {
  registerInterviewSessionDefaultsTest();
  registerNaturalInterviewSessionTest();
  registerInterviewCompletionTests();
  registerInterviewNaturalFollowUpTest();
});

function registerRoleTypeCompatibilityTest(): void {
  test("POST /api/interview/sessions accepts roleType and returns created payload", async () => {
    const response = await requestJson<{
      id: string;
      studioId: string;
      role: string;
      totalQuestions: number;
      message: string;
    }>(harness.app, "POST", INTERVIEW_SESSIONS_ENDPOINT, {
      studioId: "activision-blizzard",
      config: {
        roleType: "Build Engineer",
        questionCount: 1,
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.studioId).toBe("activision-blizzard");
    expect(response.body.role).toBe("Build Engineer");
    expect(response.body.totalQuestions).toBe(1);
    expect(response.body.message).toBe("Interview session created");
  });
}

function registerCanonicalResponsePayloadTest(): void {
  test("POST /api/interview/sessions/:id/response accepts canonical response payload", async () => {
    const created = await requestJson<{
      id: string;
      totalQuestions: number;
      totalResponses: number;
    }>(harness.app, "POST", INTERVIEW_SESSIONS_ENDPOINT, {
      studioId: "ubisoft",
      config: {
        roleType: "Technical Lead",
        questionCount: 1,
      },
    });

    const response = await requestJson<{
      status: string;
      totalResponses: number;
      message: string;
    }>(harness.app, "POST", buildInterviewResponseEndpoint(created.body.id), {
      response:
        "I structured the interview by evaluating throughput, latency, and failure domains.",
      questionIndex: 0,
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("completed");
    expect(response.body.totalResponses).toBe(1);
    expect(response.body.message).toBe("Response recorded");
  });
}

function registerJobContextPersistenceTest(): void {
  test("POST /api/interview/sessions persists job interview context", async () => {
    const candidateAssets = await seedCandidateAssets();
    const response = await requestJson<{
      id: string;
      role: string;
      studioName: string;
      config: {
        interviewMode: string;
        candidateContext?: {
          resumeId?: string;
          coverLetterId?: string;
          portfolioId?: string;
        };
        targetJob?: {
          id: string;
          title: string;
          company: string;
          location: string;
        };
      };
      questions: Array<{ question: string }>;
    }>(harness.app, "POST", INTERVIEW_SESSIONS_ENDPOINT, {
      config: {
        interviewMode: "job",
        questionCount: 2,
        candidateContext: candidateAssets,
        targetJob: {
          id: "job-123",
          title: "Senior Gameplay Engineer",
          company: "Supergiant Games",
          location: "Remote",
          technologies: ["C++", "Unreal"],
        },
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.config.interviewMode).toBe("job");
    expect(response.body.config.candidateContext).toEqual(candidateAssets);
    expect(response.body.config.targetJob?.id).toBe("job-123");
    expect(response.body.role).toBe("Senior Gameplay Engineer");
    expect(response.body.studioName).toBe("Supergiant Games");
    expect(response.body.questions[0]?.question).toContain("Senior Gameplay Engineer");
    expect(response.body.questions[0]?.question).toContain("Supergiant Games");
  });
}

function registerConversationConfigPersistenceTest(): void {
  test("POST /api/interview/sessions persists conversation style and candidate asset context", async () => {
    const candidateAssets = await seedCandidateAssets();

    const response = await requestJson<{
      config: {
        conversationStyle?: string;
        candidateContext?: {
          resumeId?: string;
          coverLetterId?: string;
          portfolioId?: string;
        };
      };
      totalQuestions: number;
    }>(harness.app, "POST", INTERVIEW_SESSIONS_ENDPOINT, {
      studioId: "riot-games",
      config: {
        questionCount: 3,
        conversationStyle: "natural",
        candidateContext: candidateAssets,
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.config.conversationStyle).toBe("natural");
    expect(response.body.config.candidateContext).toEqual(candidateAssets);
    expect(response.body.totalQuestions).toBe(1);

    const persisted = await harness.db
      .select()
      .from(resumes)
      .where(eq(resumes.id, candidateAssets.resumeId));
    expect(persisted).toHaveLength(1);
  });
}

describe("interview API contract", () => {
  registerRoleTypeCompatibilityTest();
});

describe("interview API response payload contract", () => {
  registerCanonicalResponsePayloadTest();
});

describe("interview API job context contract", () => {
  registerJobContextPersistenceTest();
});

describe("interview API conversation config contract", () => {
  registerConversationConfigPersistenceTest();
});
