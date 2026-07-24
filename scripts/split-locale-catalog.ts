/**
 * Splits a monolithic locale catalog.ts into per-namespace modules,
 * mirroring the en-US modular pattern. Removes redundant override keys
 * that match the source locale value (flagged by validate:locales).
 *
 * Usage: bun run scripts/split-locale-catalog.ts <locale>
 * Example: bun run scripts/split-locale-catalog.ts es-ES
 */
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type LocaleValue = string | number | boolean | LocaleSection | LocaleValue[];
interface LocaleSection {
  [key: string]: LocaleValue;
}

const locale = process.argv[2];
if (!locale) {
  process.stderr.write("Usage: bun run scripts/split-locale-catalog.ts <locale>\n");
  process.exit(1);
}

const localeDir = join(import.meta.dir, "..", "packages", "client", "locales", locale);
const catalogPath = join(localeDir, "catalog.ts");

if (!existsSync(catalogPath)) {
  process.stderr.write(`No catalog.ts found at ${catalogPath}\n`);
  process.exit(1);
}

const imported: { default: Record<string, LocaleSection> } = await import(catalogPath);
const catalog = imported.default;

const redundantKeys: Record<string, string[]> = {
  "es-ES": ["dashboard.dailyChallengeXpLabel", "gamificationPage.xpSuffix"],
};

const removals = redundantKeys[locale] ?? [];
for (const dotted of removals) {
  const [ns, key] = dotted.split(".");
  const section = catalog[ns];
  if (section && key in section) {
    delete section[key];
    process.stdout.write(`Removed redundant override: ${dotted}\n`);
  }
}

const namespaces = Object.keys(catalog).sort();
const moduleNames: string[] = [];

for (const ns of namespaces) {
  const value = catalog[ns];
  if (value === undefined || value === null) continue;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
    continue;

  const moduleName = ns.replace(/[^a-zA-Z0-9]/g, "");
  moduleNames.push(moduleName);

  const serialized = JSON.stringify(value, null, 2);
  const content = `const ${moduleName} = {
  ${ns}: ${serialized},
} as const;

export default ${moduleName};
`;
  const modulePath = join(localeDir, `${ns}.ts`);
  writeFileSync(modulePath, content, "utf-8");
  process.stdout.write(`Wrote ${locale}/${ns}.ts\n`);
}

const imports = moduleNames.map((m) => `import ${m} from "./${m}";`).join("\n");

const mergeArgs = moduleNames.join(",\n  ");
const catalogVarName = `${locale.replace(/[^a-zA-Z0-9]/g, "")}Catalog`;

const catalogContent = `import { mergeLocaleCatalog } from "../merge";
${imports}

const ${catalogVarName} = mergeLocaleCatalog(
  ${mergeArgs},
);

export default ${catalogVarName};
`;

rmSync(catalogPath);
writeFileSync(catalogPath, catalogContent, "utf-8");
process.stdout.write(`Wrote ${locale}/catalog.ts (${moduleNames.length} modules)\n`);
