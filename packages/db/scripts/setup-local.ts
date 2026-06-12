import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "zen-doc.db");
const MIGRATIONS_DIR = join(__dirname, "..", "src", "migrations");
const JOURNAL_PATH = join(MIGRATIONS_DIR, "meta", "_journal.json");
const STATE_PATH = join(__dirname, "..", ".migration-state.json");

interface Journal {
  dialect: string;
  entries: Array<{
    idx: number;
    tag: string;
    when: number;
    breakpoints: boolean;
  }>;
  version: string;
}

function getAppliedTags(): Set<string> {
  if (!existsSync(STATE_PATH)) {
    return new Set();
  }
  const raw = readFileSync(STATE_PATH, "utf-8");
  const data = JSON.parse(raw) as { applied: string[] };
  return new Set(data.applied);
}

function saveAppliedTags(tags: string[]) {
  writeFileSync(STATE_PATH, JSON.stringify({ applied: tags }, null, 2));
}

function parseMigrations(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const journal = JSON.parse(readFileSync(JOURNAL_PATH, "utf-8")) as Journal;
  const applied = getAppliedTags();

  console.log(
    `📋 Migration journal: ${journal.entries.length} total, ${applied.size} applied`
  );

  const pending = journal.entries.filter((e) => !applied.has(e.tag));
  if (!pending.length) {
    console.log("✅ All migrations already applied");
    return;
  }

  console.log(`⚡ Applying ${pending.length} pending migration(s):`);
  for (const entry of pending) {
    console.log(`   → ${entry.tag}`);
  }

  const db = createClient({ url: `file:${DB_PATH}` });

  for (const entry of pending) {
    const sqlPath = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    const sql = readFileSync(sqlPath, "utf-8");
    const statements = parseMigrations(sql);

    for (const stmt of statements) {
      await db.execute(stmt);
    }

    applied.add(entry.tag);
    saveAppliedTags([...applied]);
    console.log(`   ✅ ${entry.tag}`);
  }

  db.close();
  console.log(`\n🎉 Database created at: ${DB_PATH}`);
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
