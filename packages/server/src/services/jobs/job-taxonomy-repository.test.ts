import { beforeAll, describe, expect, test } from "bun:test";
import { db, sqlite } from "../../db/client";
import { initializeDatabase } from "../../db/init";
import { seedDatabase } from "../../db/seed";
import { jobTaxonomyKeywords, studioClassificationRules } from "../../db/schema/job-taxonomy";
import { readJobTaxonomy, replaceJobTaxonomy } from "./job-taxonomy-repository";

beforeAll(() => {
  initializeDatabase(sqlite);
  seedDatabase(db);
});

describe("job taxonomy repository", () => {
  test("seeds default taxonomy when taxonomy tables are empty", async () => {
    await db.delete(jobTaxonomyKeywords);
    await db.delete(studioClassificationRules);

    const taxonomy = await readJobTaxonomy();
    expect(taxonomy.keywords.length).toBeGreaterThan(0);
    expect(taxonomy.studioRules.length).toBeGreaterThan(0);
  });

  test("replaces taxonomy rows with validated persisted values", async () => {
    const taxonomy = await replaceJobTaxonomy({
      keywords: [
        {
          id: "technology:hlsl",
          category: "technology",
          label: "HLSL",
          synonyms: [],
          sortOrder: 0,
          enabled: true,
        },
      ],
      studioRules: [
        {
          id: "AAA:from-software",
          studioType: "AAA",
          keyword: "from software",
          sortOrder: 0,
          enabled: true,
        },
      ],
    });

    expect(taxonomy.keywords).toHaveLength(1);
    expect(taxonomy.keywords[0]?.label).toBe("HLSL");
    expect(taxonomy.studioRules[0]?.keyword).toBe("from software");
  });
});
