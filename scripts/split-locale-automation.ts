/**
 * Splits a locale's monolithic automation.ts into per-workflow submodules
 * under automation/, mirroring the en-US pattern. Updates catalog.ts imports.
 *
 * Usage: bun run scripts/split-locale-automation.ts <locale>
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type LocaleValue = string | number | boolean | LocaleSection | LocaleValue[];
interface LocaleSection {
  [key: string]: LocaleValue;
}

const locale = process.argv[2];
if (!locale) {
  process.stderr.write("Usage: bun run scripts/split-locale-automation.ts <locale>\n");
  process.exit(1);
}

const localeDir = join(import.meta.dir, "..", "packages", "client", "locales", locale);
const automationPath = join(localeDir, "automation.ts");
const automationDir = join(localeDir, "automation");

const imported: { default: { automation: Record<string, LocaleSection> } } = await import(
  automationPath
);
const automation = imported.default.automation;

mkdirSync(automationDir, { recursive: true });

const subNames = Object.keys(automation).sort();
const moduleNames: string[] = [];

for (const sub of subNames) {
  const value = automation[sub];
  const moduleName = `automation${sub}`;
  moduleNames.push(moduleName);
  const serialized = JSON.stringify(value, null, 2);
  const content = `const ${moduleName} = {
  automation: {
    ${sub}: ${serialized},
  },
} as const;

export default ${moduleName};
`;
  writeFileSync(join(automationDir, `${sub}.ts`), content, "utf-8");
  process.stdout.write(`Wrote ${locale}/automation/${sub}.ts\n`);
}

const catalogPath = join(localeDir, "catalog.ts");
let catalog = readFileSync(catalogPath, "utf-8");

catalog = catalog.replace(
  `import automation from "./automation";`,
  moduleNames
    .map((m) => `import ${m} from "./automation/${m.replace("automation", "")}";`)
    .join("\n"),
);

catalog = catalog.replace(/^  automation,$/m, moduleNames.map((m) => `  ${m},`).join("\n"));

writeFileSync(catalogPath, catalog, "utf-8");
rmSync(automationPath);
process.stdout.write(`Updated ${locale}/catalog.ts, removed automation.ts\n`);
