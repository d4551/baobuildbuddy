import { Database } from "bun:sqlite";
import { resolveDatabasePath } from "../packages/server/src/config/paths";
import { resolveContentHash } from "../packages/server/src/services/jobs/deduplication";
import { writeOutput } from "./utils/cli-output";

/**
 * Collapses job rows that the two ingest paths stored twice under different identities.
 *
 * Before `resolveContentHash` became the single owner of job identity, the aggregator always
 * derived `sha256(title|company|location)` while the scraper persistence path preferred the
 * provider's own hash. One posting reaching both paths was therefore written twice — once as
 * `87559af9…`, once as `hitmarker-b19a28…` — and neither `content_hash` upsert could see the
 * other. New ingests no longer split; the rows already stored still do.
 *
 * Within each duplicate group this keeps the row whose stored hash equals what ingest now
 * writes — asked of `resolveContentHash` directly rather than guessed from the hash's shape,
 * since that guess would keep provider-scheme rows, which ingest no longer produces. Ties
 * break to the oldest row. A group whose rows disagree on url/description/source is reported
 * and left alone.
 *
 * Dry run by default. Pass `--apply` to delete, `--db=<path>` to target another database.
 */
const APPLY_FLAG = "--apply";
const DB_FLAG = "--db=";
/** Enough hash to tell the two schemes apart in the report without printing 64 hex chars. */
const HASH_PREVIEW_LENGTH = 20;

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  content_hash: string;
  url: string | null;
  description: string | null;
  source: string | null;
  created_at: string;
};

/** Fields that must agree before one row may stand in for another. */
const identityFingerprint = (row: JobRow): string =>
  [row.url ?? "", row.description ?? "", row.source ?? ""].join(" ");

const groupKey = (row: JobRow): string =>
  [row.title, row.company, row.location].map((part) => part.trim().toLowerCase()).join(" ");

/**
 * Keeps the row whose stored hash equals the identity ingest now writes, so the survivor is
 * the row the next scrape will update rather than duplicate. Asking the owner directly avoids
 * guessing from the hash's shape — that guess would have kept the provider-scheme rows, which
 * are precisely the ones ingest no longer produces.
 */
const chooseSurvivor = (rows: readonly JobRow[]): JobRow => {
  const expected = resolveContentHash(rows[0]);
  const matching = rows.filter((row) => row.content_hash === expected);
  const candidates = matching.length > 0 ? matching : rows;
  const ordered = [...candidates].sort((left, right) =>
    left.created_at.localeCompare(right.created_at),
  );
  const survivor = ordered[0];
  if (!survivor) {
    throw new Error("duplicate group resolved to no survivor");
  }
  return survivor;
};

const resolveTargetDatabase = (): string => {
  const override = Bun.argv.find((entry) => entry.startsWith(DB_FLAG));
  return override ? override.slice(DB_FLAG.length) : resolveDatabasePath();
};

const groupRows = (rows: readonly JobRow[]): JobRow[][] => {
  const groups = new Map<string, JobRow[]>();
  for (const row of rows) {
    const key = groupKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
};

const databasePath = resolveTargetDatabase();
const apply = Bun.argv.includes(APPLY_FLAG);
// Dry runs open read-only so the default invocation physically cannot mutate the database.
const database = apply
  ? new Database(databasePath)
  : new Database(databasePath, { readonly: true });

const allRows = database
  .query(
    "SELECT id, title, company, location, content_hash, url, description, source, created_at FROM jobs",
  )
  .all() as JobRow[];

const duplicateGroups = groupRows(allRows);
const doomed: JobRow[] = [];
const conflicts: string[] = [];

for (const group of duplicateGroups) {
  const survivor = chooseSurvivor(group);
  const fingerprint = identityFingerprint(survivor);
  const divergent = group.filter(
    (row) => row.id !== survivor.id && identityFingerprint(row) !== fingerprint,
  );
  if (divergent.length > 0) {
    conflicts.push(`${survivor.company} — ${survivor.title}`);
    continue;
  }
  doomed.push(...group.filter((row) => row.id !== survivor.id));
}

const report = [
  `database: ${databasePath}`,
  `rows: ${allRows.length}`,
  `duplicate groups: ${duplicateGroups.length}`,
  `removable rows: ${doomed.length}`,
  `groups whose rows differ in content (left untouched): ${conflicts.length}`,
  ...conflicts.map((entry) => `  ! ${entry}`),
  ...doomed.map(
    (row) => `  - ${row.content_hash.slice(0, HASH_PREVIEW_LENGTH)}  ${row.company} — ${row.title}`,
  ),
];

if (apply) {
  const deleteRow = database.query("DELETE FROM jobs WHERE id = ?");
  const removeAll = database.transaction((victims: readonly JobRow[]) => {
    for (const row of victims) {
      deleteRow.run(row.id);
    }
  });
  removeAll(doomed);

  const remaining = database.query("SELECT COUNT(*) AS n FROM jobs").get() as { n: number };
  report.push("", `applied — ${doomed.length} row(s) deleted, ${remaining.n} remaining.`);
} else {
  report.push("", `dry run — re-run with ${APPLY_FLAG} to delete the rows listed above.`);
}

await writeOutput(report.join("\n"));
database.close();
