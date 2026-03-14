import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { extractGamesJobsDirectJobs } from "./gamesjobsdirect";
import { extractGrackleJobs } from "./grackle";
import { extractHitmarkerJobs } from "./hitmarker";
import { extractPocketGamerJobs } from "./pocketgamer";
import { extractRemoteGameJobs } from "./remotegamejobs";
import type { PageEvaluator } from "./provider-types";
import { extractWorkWithIndiesJobs } from "./workwithindies";

type DomGlobalState = {
  window?: Window;
  document?: Document;
  HTMLElement?: typeof globalThis.HTMLElement;
  HTMLAnchorElement?: typeof globalThis.HTMLAnchorElement;
};

const TEST_SOURCE_URL = "https://example.com/jobs";

const captureDomGlobals = (): DomGlobalState => {
  const runtime = globalThis as typeof globalThis & Partial<DomGlobalState>;

  return {
    window: runtime.window,
    document: runtime.document,
    HTMLElement: runtime.HTMLElement,
    HTMLAnchorElement: runtime.HTMLAnchorElement,
  };
};

const restoreDomGlobals = (state: DomGlobalState): void => {
  const runtime = globalThis as typeof globalThis & Partial<DomGlobalState>;

  if (state.window) {
    runtime.window = state.window;
  } else {
    delete runtime.window;
  }

  if (state.document) {
    runtime.document = state.document;
  } else {
    delete runtime.document;
  }

  if (state.HTMLElement) {
    runtime.HTMLElement = state.HTMLElement;
  } else {
    delete runtime.HTMLElement;
  }

  if (state.HTMLAnchorElement) {
    runtime.HTMLAnchorElement = state.HTMLAnchorElement;
  } else {
    delete runtime.HTMLAnchorElement;
  }
};

const createEvaluatePage = (html: string): PageEvaluator => {
  const window = new Window();
  Reflect.set(window, "SyntaxError", SyntaxError);
  window.document.body.innerHTML = html;

  return {
    evaluate: async <Result, Arg>(
      pageFunction: (() => Result) | ((arg: Arg) => Result),
      arg?: Arg,
    ): Promise<Result> => {
      const previousGlobals = captureDomGlobals();
      const runtime = globalThis as typeof globalThis & Partial<DomGlobalState>;

      runtime.window = window;
      runtime.document = window.document;
      runtime.HTMLElement = window.HTMLElement;
      runtime.HTMLAnchorElement = window.HTMLAnchorElement;

      try {
        if (typeof arg === "undefined") {
          return (pageFunction as () => Result)();
        }

        return (pageFunction as (value: Arg) => Result)(arg);
      } finally {
        restoreDomGlobals(previousGlobals);
      }
    },
  };
};

describe("portal job extractors", () => {
  test("extracts Hitmarker cards", async () => {
    const rows = await extractHitmarkerJobs(
      createEvaluatePage(`
        <a href="/jobs/1">
          <div>Gameplay Engineer</div>
          <div>Studio Alpha</div>
          <div>Remote - Worldwide</div>
        </a>
      `),
      TEST_SOURCE_URL,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Gameplay Engineer");
    expect(rows[0]?.company).toBe("Studio Alpha");
    expect(rows[0]?.remote).toBe(true);
  });
});

describe("portal job extractors: listing feeds", () => {
  test("extracts Grackle listings", async () => {
    const rows = await extractGrackleJobs(
      createEvaluatePage(`
        <div class="joblisting">
          <a href="/jobs/2">Senior Tools Engineer</a>
          Studio Beta - Vancouver, BC
        </div>
      `),
      TEST_SOURCE_URL,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Studio Beta");
    expect(rows[0]?.location).toContain("Vancouver");
  });

  test("extracts Work With Indies cards", async () => {
    const rows = await extractWorkWithIndiesJobs(
      createEvaluatePage(`
        <a class="job-card" href="/careers/123">
          Ember Lab is hiring a Gameplay Programmer to work from Remote Learn More
        </a>
      `),
      TEST_SOURCE_URL,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Ember Lab");
    expect(rows[0]?.title).toBe("Gameplay Programmer");
  });

  test("extracts RemoteGameJobs boxes", async () => {
    const rows = await extractRemoteGameJobs(
      createEvaluatePage(`
        <div class="job-box">
          <div><a class="has-text-black" href="/jobs/remote-1">Backend Engineer</a></div>
          <div>Studio Remote</div>
          <div>Full-time</div>
          <div>Remote</div>
        </div>
      `),
      TEST_SOURCE_URL,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Studio Remote");
    expect(rows[0]?.location).toBe("Remote");
  });
});

describe("portal job extractors: article and portal cards", () => {
  test("extracts GamesJobsDirect links", async () => {
    const rows = await extractGamesJobsDirectJobs(
      createEvaluatePage(`
        <article>
          <div><a href="/job/rendering">Rendering Engineer</a></div>
          <div>Studio Gamma - Remote</div>
        </article>
      `),
      TEST_SOURCE_URL,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.company).toBe("Studio Gamma");
  });

  test("extracts PocketGamer articles", async () => {
    const rows = await extractPocketGamerJobs(
      createEvaluatePage(`
        <article>
          <h2>Economy Designer</h2>
          <div class="company">Studio Delta</div>
          <p class="description">Design free-to-play systems.</p>
          <a href="/job/economy">View role</a>
        </article>
      `),
      TEST_SOURCE_URL,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.description).toContain("free-to-play");
  });
});
