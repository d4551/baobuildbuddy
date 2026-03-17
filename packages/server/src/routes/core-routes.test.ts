import {
  API_ERROR_AUTH_SETUP_TOKEN_INVALID,
  API_ERROR_AUTH_SETUP_TOKEN_REQUIRED,
  API_MESSAGE_API_KEY_ALREADY_CONFIGURED,
  API_MESSAGE_AUTH_DISABLED,
  API_MESSAGE_SAVE_API_KEY_ONCE,
  AUTH_API_KEY_PREFIX_PATTERN,
  DEFAULT_PROFILE_ID,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
} from "@bao/shared";
import { beforeAll, describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requestJson } from "../test-utils";

type SearchCountSnapshot = {
  jobs: number;
  studios: number;
  skills: number;
  resumes: number;
};

type SearchResult = {
  type: "jobs" | "studios" | "skills" | "resumes";
  id: string;
  title: string;
  subtitle: string;
  snippet: string;
  relevance: number;
};

type SearchResponse = {
  query: string;
  results: SearchResult[];
  counts: SearchCountSnapshot;
  totalTime: number;
};

type AuthStatusResponse = {
  authRequired: boolean;
  configured: boolean;
  bootstrapRequired: boolean;
  setupTokenConfigured: boolean;
};

type AuthInitResponse = {
  configured: boolean;
  apiKey?: string;
  message: string;
};

type UserProfileResponse = {
  id: string;
  name: string;
  email?: string | null;
};

type GamificationProgressResponse = {
  xp: number;
  level: number;
  achievements: string[];
  currentStreak: number;
};

type GamificationChallengesResponse = {
  date: string;
  challenges: Array<{
    id: string;
    completed: boolean;
    text?: string;
    type?: string;
  }>;
  completedCount: number;
  totalCount: number;
};

type GamificationChallengeCompleteResponse = {
  completed: boolean;
  challengeId?: string;
  message?: string;
  totalXP?: number;
  level?: number;
};

type WeeklyActivityResponse = {
  days: Array<{
    date: string;
    actions: number;
    xpEarned: number;
  }>;
  topCategory: string;
  totalXP: number;
};

type CareerProgressResponse = {
  skillCoverage: number;
  applicationSuccessRate: number;
  interviewTrend: Array<string>;
};

type DashboardStatsResponse = {
  profile: { completeness: number };
  jobs: { saved: number; applied: number; interviewing: number; offered: number };
  resumes: { count: number; lastUpdated: string | null };
  coverLetters: { count: number };
  portfolio: { projectCount: number };
  interviews: { totalSessions: number; averageScore: number | null };
  skills: { mappedCount: number };
  ai: { chatMessages: number; chatSessions: number };
  gamification: { level: number; xp: number; achievements: number; streak: number };
  automation: {
    totalRuns: number;
    successfulRuns: number;
    successRate: number;
    todayRuns: number;
    recentRuns: unknown[];
  };
};

const SEARCH_QUERY_SHORT = "a";
const SEARCH_FILTER_QUERY = "unity";
const SEARCH_FILTER_TYPES = "jobs,studios";
const AUTOCOMPLETE_SHORT_PREFIX = "a";
const AUTOCOMPLETE_ROLE_PREFIX = "de";

Bun.env.DB_PATH = join(tmpdir(), "bao-core-route-tests", `${crypto.randomUUID()}.db`);
Bun.env.BAO_AUTH_SETUP_TOKEN = "core-route-setup-token";

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModules = await Promise.all([
    import("./auth.routes"),
    import("./search.routes"),
    import("./user.routes"),
    import("./gamification.routes"),
    import("./stats.routes"),
  ]);
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" })
    .use(routesModules[0].authRoutes)
    .use(routesModules[1].searchRoutes)
    .use(routesModules[2].userRoutes)
    .use(routesModules[3].gamificationRoutes)
    .use(routesModules[4].statsRoutes);
});

describe("search routes", () => {
  test("GET /api/search returns empty results for short queries", async () => {
    const shortSearchUrl = `/api/search?${new URLSearchParams({ q: SEARCH_QUERY_SHORT })}`;
    const res = await requestJson<SearchResponse>(app, "GET", shortSearchUrl);
    expect(res.status).toBe(200);
    expect(res.body.query).toBe(SEARCH_QUERY_SHORT);
    expect(res.body.results).toEqual([]);
    expect(res.body.counts).toEqual({ jobs: 0, studios: 0, skills: 0, resumes: 0 });
    expect(res.body.totalTime).toBeGreaterThanOrEqual(0);
  });

  test("GET /api/search filters by requested types", async () => {
    const filteredSearchUrl = `/api/search?${new URLSearchParams({
      q: SEARCH_FILTER_QUERY,
      types: SEARCH_FILTER_TYPES,
    })}`;
    const res = await requestJson<SearchResponse>(app, "GET", filteredSearchUrl);
    expect(res.status).toBe(200);
    expect(res.body.query).toBe(SEARCH_FILTER_QUERY);
    expect(typeof res.body.counts.jobs).toBe("number");
    expect(typeof res.body.counts.studios).toBe("number");
  });

  test("GET /api/search/autocomplete returns empty results for short prefix", async () => {
    const shortAutocompleteUrl = `/api/search/autocomplete?${new URLSearchParams({
      prefix: AUTOCOMPLETE_SHORT_PREFIX,
    })}`;
    const res = await requestJson<Array<{ text: string; type: string }>>(
      app,
      "GET",
      shortAutocompleteUrl,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("GET /api/search/autocomplete returns suggestions for valid prefix", async () => {
    const roleAutocompleteUrl = `/api/search/autocomplete?${new URLSearchParams({
      prefix: AUTOCOMPLETE_ROLE_PREFIX,
    })}`;
    const res = await requestJson<Array<{ text: string; type: string }>>(
      app,
      "GET",
      roleAutocompleteUrl,
    );
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((entry) => entry.type === "role")).toBe(true);
  });
});

describe("auth routes", () => {
  test("GET /api/auth/status returns auth mode", async () => {
    const res = await requestJson<AuthStatusResponse>(app, "GET", "/api/auth/status");
    expect(res.status).toBe(200);
    expect(typeof res.body.authRequired).toBe("boolean");
    expect(typeof res.body.configured).toBe("boolean");
    expect(typeof res.body.bootstrapRequired).toBe("boolean");
    expect(typeof res.body.setupTokenConfigured).toBe("boolean");
  });

});

describe("auth init routes", () => {
  test("POST /api/auth/init requires a valid setup token before initializing API key", async () => {
    const status = await requestJson<AuthStatusResponse>(app, "GET", "/api/auth/status");

    if (status.body.authRequired) {
      expect(status.body.bootstrapRequired).toBe(true);
      expect(status.body.setupTokenConfigured).toBe(true);

      const missingToken = await requestJson<{ error: string }>(app, "POST", "/api/auth/init");
      expect(missingToken.status).toBe(HTTP_STATUS_BAD_REQUEST);
      expect(missingToken.body.error).toBe(API_ERROR_AUTH_SETUP_TOKEN_REQUIRED);

      const invalidToken = await requestJson<{ error: string }>(app, "POST", "/api/auth/init", {
        setupToken: "wrong-token",
      });
      expect(invalidToken.status).toBe(HTTP_STATUS_FORBIDDEN);
      expect(invalidToken.body.error).toBe(API_ERROR_AUTH_SETUP_TOKEN_INVALID);

      const res = await requestJson<AuthInitResponse>(app, "POST", "/api/auth/init", {
        setupToken: Bun.env.BAO_AUTH_SETUP_TOKEN,
      });
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
      expect(res.body.apiKey).toMatch(AUTH_API_KEY_PREFIX_PATTERN);
      expect(res.body.message).toBe(API_MESSAGE_SAVE_API_KEY_ONCE);

      const second = await requestJson<AuthInitResponse>(app, "POST", "/api/auth/init", {
        setupToken: Bun.env.BAO_AUTH_SETUP_TOKEN,
      });
      expect(second.status).toBe(200);
      expect(second.body.configured).toBe(true);
      expect(second.body.message).toBe(API_MESSAGE_API_KEY_ALREADY_CONFIGURED);
      expect(second.body.apiKey).toBeUndefined();
    } else {
      const res = await requestJson<AuthInitResponse>(app, "POST", "/api/auth/init", {});
      expect(res.status).toBe(200);
      expect(res.body.apiKey).toBeUndefined();
      expect(res.body.message).toBe(API_MESSAGE_AUTH_DISABLED);
      expect(res.body.configured).toBe(false);
    }
  });
});

describe("auth configured routes", () => {
  test("GET /api/auth/configured reflects key configuration state", async () => {
    const configured = await requestJson<{ configured: boolean }>(
      app,
      "GET",
      "/api/auth/configured",
    );
    expect(configured.status).toBe(200);
    expect(typeof configured.body.configured).toBe("boolean");
  });
});

describe("user routes", () => {
  test("GET /api/user/profile auto-creates the default profile", async () => {
    const profile = await requestJson<UserProfileResponse>(app, "GET", "/api/user/profile");
    expect(profile.status).toBe(200);
    expect(profile.body.id).toBe(DEFAULT_PROFILE_ID);
    expect(profile.body.name).toBe("");
  });

  test("PUT /api/user/profile updates and persists profile values", async () => {
    const updated = await requestJson<UserProfileResponse>(app, "PUT", "/api/user/profile", {
      name: "Core Route Audit",
      email: "audit@example.com",
      currentRole: "QA Auditor",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.id).toBe(DEFAULT_PROFILE_ID);
    expect(updated.body.name).toBe("Core Route Audit");
    expect(updated.body.email).toBe("audit@example.com");

    const readback = await requestJson<UserProfileResponse>(app, "GET", "/api/user/profile");
    expect(readback.status).toBe(200);
    expect(readback.body.name).toBe("Core Route Audit");
    expect(readback.body.email).toBe("audit@example.com");
  });
});

describe("gamification routes", () => {
  test("GET /api/gamification/progress returns base progress", async () => {
    const res = await requestJson<GamificationProgressResponse>(
      app,
      "GET",
      "/api/gamification/progress",
    );
    expect(res.status).toBe(200);
    expect(res.body.xp).toBeGreaterThanOrEqual(0);
    expect(res.body.level).toBeGreaterThan(0);
    expect(Array.isArray(res.body.achievements)).toBe(true);
    expect(res.body.currentStreak).toBeGreaterThanOrEqual(0);
  });

  test("POST /api/gamification/award-xp accepts positive XP grant", async () => {
    const res = await requestJson<{
      xp: number;
      level: number;
      leveledUp: boolean;
      levelUp: { oldLevel: number; newLevel: number; newTitle: string } | null;
      reason: string;
      message: string;
    }>(app, "POST", "/api/gamification/award-xp", {
      amount: 25,
      reason: "audit",
    });
    expect(res.status).toBe(200);
    expect(res.body.reason).toBe("audit");
    expect(typeof res.body.xp).toBe("number");
    expect(typeof res.body.level).toBe("number");
    expect(typeof res.body.leveledUp).toBe("boolean");
    expect(res.body.message).toContain("XP");
  });

  test("GET /api/gamification/challenges returns today's challenge list", async () => {
    const res = await requestJson<GamificationChallengesResponse>(
      app,
      "GET",
      "/api/gamification/challenges",
    );
    expect(res.status).toBe(200);
    expect(res.body.challenges.length).toBeGreaterThan(0);
    expect(res.body.totalCount).toBe(res.body.challenges.length);
    expect(res.body.completedCount).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.date).toBe("string");
  });

  test("POST /api/gamification/challenges/:id/complete rejects unknown challenge id", async () => {
    const res = await requestJson<GamificationChallengeCompleteResponse>(
      app,
      "POST",
      "/api/gamification/challenges/does-not-exist/complete",
    );
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
  });
});

describe("stats routes", () => {
  test("GET /api/stats/dashboard returns aggregate values", async () => {
    const res = await requestJson<DashboardStatsResponse>(app, "GET", "/api/stats/dashboard");
    expect(res.status).toBe(200);
    expect(typeof res.body.profile.completeness).toBe("number");
    expect(typeof res.body.jobs.saved).toBe("number");
    expect(Array.isArray(res.body.automation.recentRuns)).toBe(true);
  });

  test("GET /api/stats/weekly returns 7-day activity view", async () => {
    const res = await requestJson<WeeklyActivityResponse>(app, "GET", "/api/stats/weekly");
    expect(res.status).toBe(200);
    expect(res.body.days.length).toBe(7);
    expect(typeof res.body.topCategory).toBe("string");
    expect(typeof res.body.totalXP).toBe("number");
  });

  test("GET /api/stats/career returns skill coverage metrics", async () => {
    const res = await requestJson<CareerProgressResponse>(app, "GET", "/api/stats/career");
    expect(res.status).toBe(200);
    expect(typeof res.body.skillCoverage).toBe("number");
    expect(typeof res.body.applicationSuccessRate).toBe("number");
    expect(Array.isArray(res.body.interviewTrend)).toBe(true);
  });
});
