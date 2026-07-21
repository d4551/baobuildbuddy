/**
 * Find Vue tags with two :class bindings (Vite/Vue compile failure).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".nuxt" || entry.name === "dist") {
        continue;
      }
      out.push(...(await walk(path)));
      continue;
    }
    if (entry.name.endsWith(".vue")) {
      out.push(path);
    }
  }
  return out;
};

const dual: string[] = [];
for (const file of await walk("packages/client")) {
  const content = await Bun.file(file).text();
  const re = /<[^>]*:class="[^"]*"[^>]*:class="/gu;
  let match = re.exec(content);
  while (match) {
    dual.push(`${file}:${content.slice(0, match.index).split("\n").length}`);
    match = re.exec(content);
  }
}
await Bun.write("scripts/.tmp-dual-class.txt", `${dual.join("\n")}\ncount=${dual.length}\n`);
