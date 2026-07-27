import { describe, expect, test } from "bun:test";
import { collectBespokeCardSurfaces } from "./validate-canonical-card-surface";

const wrapTemplate = (body: string): string => `<script setup lang="ts"></script>

<template>
${body}
</template>`;

describe("collectBespokeCardSurfaces flags hand-composed surfaces", () => {
  test("flags the exact composition ResumeLibraryPanel had shipped", () => {
    const violations = collectBespokeCardSurfaces(
      "packages/client/components/resume/ResumeLibraryPanel.vue",
      wrapTemplate('  <div class="card card-border bg-base-100 hover:bg-base-200"></div>'),
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("UiGlassCard");
    expect(violations[0]?.line).toBe(4);
  });

  test("flags a card composed with only a border utility", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/A.vue",
        wrapTemplate('  <section class="card card-dash"></section>'),
      ),
    ).toHaveLength(1);
  });

  test("flags a card that hand-composes the glass classes", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/B.vue",
        wrapTemplate('  <section class="card card-border card-glass"></section>'),
      ),
    ).toHaveLength(1);
  });

  test("reports every offending element in one file", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/C.vue",
        wrapTemplate(
          [
            '  <div class="card card-border bg-base-100"></div>',
            '  <div class="card card-dash bg-base-200"></div>',
          ].join("\n"),
        ),
      ),
    ).toHaveLength(2);
  });
});

describe("collectBespokeCardSurfaces leaves legitimate markup alone", () => {
  test("passes card layout children, which are not surfaces", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/D.vue",
        wrapTemplate(
          '  <div class="card-body"><h3 class="card-title"></h3><div class="card-actions"></div></div>',
        ),
      ),
    ).toEqual([]);
  });

  test("passes a bound surface token, which keeps the class list in the SSOT", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/E.vue",
        wrapTemplate('  <section :class="SURFACE_GLASS_CARD_CLASS"></section>'),
      ),
    ).toEqual([]);
  });

  test("passes a UiGlassCard usage", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/F.vue",
        wrapTemplate('  <UiGlassCard :stagger-index="0"><div class="card-body" /></UiGlassCard>'),
      ),
    ).toEqual([]);
  });

  test("passes a bare card token with no surface utility of its own", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/G.vue",
        wrapTemplate('  <div class="card"></div>'),
      ),
    ).toEqual([]);
  });

  test("exempts the primitive itself, which must compose the surface", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/ui/UiGlassCard.vue",
        wrapTemplate('  <article class="card card-border bg-base-100"></article>'),
      ),
    ).toEqual([]);
  });

  test("ignores a composition that appears only in the script block", () => {
    expect(
      collectBespokeCardSurfaces(
        "packages/client/components/x/H.vue",
        `<script setup lang="ts">
const legacy = 'card card-border bg-base-100';
</script>

<template>
  <div :class="legacy"></div>
</template>`,
      ),
    ).toEqual([]);
  });
});
