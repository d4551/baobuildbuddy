import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { extractGamesJobsDirectJobs } from "./gamesjobsdirect";
import { extractGrackleJobs } from "./grackle";
import { extractHitmarkerJobs } from "./hitmarker";
import { extractPocketGamerJobs } from "./pocketgamer";
import { extractRemoteGameJobs } from "./remotegamejobs";
import type { PageEvaluator } from "./provider-types";
import { extractWorkWithIndiesJobs } from "./workwithindies";

const DOM_GLOBAL_KEYS = [
  "window",
  "document",
  "HTMLElement",
  "HTMLAnchorElement",
] as const;
const DOM_GLOBAL_ABSENT = Symbol("dom-global-absent");

type DomGlobalKey = (typeof DOM_GLOBAL_KEYS)[number];
type DomGlobalValue = object | undefined | typeof DOM_GLOBAL_ABSENT;
type DomGlobalState = Record<DomGlobalKey, DomGlobalValue>;

const TEST_SOURCE_URL = "https://example.com/jobs";

const captureDomGlobals = (): DomGlobalState => {
  return Object.fromEntries(
    DOM_GLOBAL_KEYS.map((key) => [
      key,
      Reflect.has(globalThis, key)
        ? Reflect.get(globalThis, key)
        : DOM_GLOBAL_ABSENT,
    ]),
  ) as DomGlobalState;
};

const restoreDomGlobals = (state: DomGlobalState): void => {
  for (const key of DOM_GLOBAL_KEYS) {
    if (state[key] === DOM_GLOBAL_ABSENT) {
      Reflect.deleteProperty(globalThis, key);
      continue;
    }

    Reflect.set(globalThis, key, state[key]);
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
      Reflect.set(globalThis, "window", window);
      Reflect.set(globalThis, "document", window.document);
      Reflect.set(globalThis, "HTMLElement", window.HTMLElement);
      Reflect.set(globalThis, "HTMLAnchorElement", window.HTMLAnchorElement);

      const [evaluationResult] = await Promise.allSettled([
        Promise.resolve(
          typeof arg === "undefined"
            ? (pageFunction as () => Result)()
            : (pageFunction as (value: Arg) => Result)(arg),
        ),
      ]);
      restoreDomGlobals(previousGlobals);

      if (evaluationResult.status === "rejected") {
        throw evaluationResult.reason;
      }

      return evaluationResult.value;
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
