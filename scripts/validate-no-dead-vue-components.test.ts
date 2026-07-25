import { describe, expect, test } from "bun:test";
import { collectDeadVueComponentViolationsForContent } from "./validate-no-dead-vue-components";

describe("collectDeadVueComponentViolationsForContent: flags Vue components with no template or import consumer", () => {
  test("flags Vue components with no template or import consumer", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/DeadTestComponent.vue",
      [],
      new Set(),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("DeadTestComponent");
  });
});

describe("collectDeadVueComponentViolationsForContent: passes Vue components referenced via PascalCase template tag", () => {
  test("passes Vue components referenced via PascalCase template tag", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/UsedComponent.vue",
      [
        {
          filePath: "packages/client/pages/index.vue",
          content: "<UsedComponent />",
        },
      ],
      new Set(),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: passes Vue components referenced via kebab-case template tag", () => {
  test("passes Vue components referenced via kebab-case template tag", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/UsedComponent.vue",
      [
        {
          filePath: "packages/client/pages/index.vue",
          content: "<used-component />",
        },
      ],
      new Set(),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: passes Vue components referenced via Lazy prefix", () => {
  test("passes Vue components referenced via Lazy prefix", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/UsedComponent.vue",
      [
        {
          filePath: "packages/client/layouts/default.vue",
          content: "<LazyUsedComponent />",
        },
      ],
      new Set(),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: passes Vue components referenced via lazy kebab-case tag", () => {
  test("passes Vue components referenced via lazy kebab-case tag", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/UsedComponent.vue",
      [
        {
          filePath: "packages/client/layouts/default.vue",
          content: "<lazy-used-component />",
        },
      ],
      new Set(),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: does not count the component file itself as a consumer", () => {
  test("does not count the component file itself as a consumer", () => {
    const componentContent = "<UsedComponent />";
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/UsedComponent.vue",
      [
        {
          filePath: "packages/client/components/ui/UsedComponent.vue",
          content: componentContent,
        },
      ],
      new Set(),
    );

    expect(violations).toHaveLength(1);
  });
});

describe("collectDeadVueComponentViolationsForContent: does not count test files as consumers", () => {
  test("does not count test files as consumers", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/ui/UsedComponent.vue",
      [
        {
          filePath: "packages/client/components/ui/UsedComponent.spec.ts",
          content: "import UsedComponent from './UsedComponent.vue';",
        },
      ],
      new Set(),
    );

    expect(violations).toHaveLength(1);
  });
});

describe("collectDeadVueComponentViolationsForContent: skips framework entrypoint files (pages, layouts, app.vue)", () => {
  test("skips framework entrypoint files (pages, layouts, app.vue)", () => {
    expect(
      collectDeadVueComponentViolationsForContent("packages/client/pages/index.vue", [], new Set()),
    ).toHaveLength(0);

    expect(
      collectDeadVueComponentViolationsForContent(
        "packages/client/layouts/default.vue",
        [],
        new Set(),
      ),
    ).toHaveLength(0);

    expect(
      collectDeadVueComponentViolationsForContent("packages/client/app.vue", [], new Set()),
    ).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: skips non-Vue and non-component files", () => {
  test("skips non-Vue and non-component files", () => {
    expect(
      collectDeadVueComponentViolationsForContent(
        "packages/client/composables/useFoo.ts",
        [],
        new Set(),
      ),
    ).toHaveLength(0);

    expect(
      collectDeadVueComponentViolationsForContent(
        "packages/server/src/routes/jobs.routes.ts",
        [],
        new Set(),
      ),
    ).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: passes icons registered in the icon registry (dynamic resolution surface)", () => {
  test("passes icons registered in the icon registry (dynamic resolution surface)", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/icons/IconBolt.vue",
      [],
      new Set(["IconBolt"]),
    );

    expect(violations).toHaveLength(0);
  });
});

describe("collectDeadVueComponentViolationsForContent: flags icons NOT registered in the icon registry with no other consumer", () => {
  test("flags icons NOT registered in the icon registry with no other consumer", () => {
    const violations = collectDeadVueComponentViolationsForContent(
      "packages/client/components/icons/IconDead.vue",
      [],
      new Set(["IconBolt"]),
    );

    expect(violations).toHaveLength(1);
  });
});
