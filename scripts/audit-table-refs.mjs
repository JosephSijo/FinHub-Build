// scripts/audit-table-refs.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set(["node_modules", "dist", "build", ".git", ".next"]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (EXTS.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

const files = walk(ROOT);

const tableRefs = new Map(); // table -> [{file,line,snippet}]

const patterns = [
  /supabase\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  /fromTable\(\s*DB_TABLES\.([A-Za-z0-9_]+)\s*\)/g,
  /["'`](accounts|transactions|kv_store|category_limits|ious|iou_payments|iou_installments|scheduled_payments|reserves|credit_cards|fee_rules|smart_suggestions|reminder_jobs|reminder_channels)["'`]/g,
];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rx of patterns) {
      rx.lastIndex = 0;
      let m;
      while ((m = rx.exec(line))) {
        const key = m[1];
        if (!key) continue;

        const tbl = rx.source.includes("DB_TABLES") ? `DB_TABLES.${key}` : key;

        if (!tableRefs.has(tbl)) tableRefs.set(tbl, []);
        tableRefs.get(tbl).push({
          file: path.relative(ROOT, file),
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
  }
}

const result = [...tableRefs.entries()].sort((a, b) =>
  a[0].localeCompare(b[0])
);

fs.writeFileSync("table-refs.json", JSON.stringify(result, null, 2));
console.log("✅ Extracted table refs -> table-refs.json");
console.log("Found:", result.length, "unique table references");
