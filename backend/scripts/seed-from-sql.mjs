import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lms";
const MONGODB_DB = process.env.MONGODB_DB || "lms";

function parseArgs(argv) {
  const args = {
    sqlDir: path.resolve(process.cwd(), "database"),
    files: null,
    drop: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--drop") {
      args.drop = true;
      continue;
    }
    if (arg === "--sqlDir" && argv[i + 1]) {
      args.sqlDir = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--files" && argv[i + 1]) {
      args.files = argv[i + 1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      i += 1;
    }
  }

  return args;
}

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function splitSqlStatements(content) {
  const statements = [];
  let current = "";
  let inString = false;
  let quoteChar = "'";

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : "";

    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      quoteChar = ch;
      current += ch;
      continue;
    }

    if (inString && ch === quoteChar && prev !== "\\") {
      inString = false;
      current += ch;
      continue;
    }

    if (!inString && ch === ";") {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      continue;
    }

    current += ch;
  }

  const last = current.trim();
  if (last) statements.push(last);
  return statements;
}

function splitTopLevel(text, delimiter = ",") {
  const parts = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quoteChar = "'";

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : "";

    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      quoteChar = ch;
      current += ch;
      continue;
    }

    if (inString && ch === quoteChar && prev !== "\\") {
      inString = false;
      current += ch;
      continue;
    }

    if (!inString) {
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;
      if (ch === delimiter && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function decodeSqlString(token) {
  let value = token;
  if (value.length >= 2 && ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"')))) {
    value = value.slice(1, -1);
  }
  value = value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/''/g, "'");
  return value;
}

function resolveToken(token, vars) {
  const t = token.trim();

  if (!t) return null;
  if (/^NULL$/i.test(t)) return null;
  if (/^TRUE$/i.test(t)) return true;
  if (/^FALSE$/i.test(t)) return false;
  if (/^@\w+$/i.test(t)) return vars.get(t.toLowerCase()) ?? null;
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) return decodeSqlString(t);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);

  return t;
}

function parseInsertStatement(statement) {
  const match = statement.match(/^INSERT\s+INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s+([\s\S]+)$/i);
  if (!match) return null;

  const table = match[1];
  const columns = match[2].split(",").map((c) => c.replace(/`/g, "").trim());
  const valuesBlock = match[3].trim();

  const tuples = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quoteChar = "'";

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const ch = valuesBlock[i];
    const prev = i > 0 ? valuesBlock[i - 1] : "";

    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      quoteChar = ch;
      if (depth > 0) current += ch;
      continue;
    }

    if (inString && ch === quoteChar && prev !== "\\") {
      inString = false;
      if (depth > 0) current += ch;
      continue;
    }

    if (!inString && ch === "(") {
      depth += 1;
      if (depth === 1) {
        current = "";
      } else {
        current += ch;
      }
      continue;
    }

    if (!inString && ch === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
      continue;
    }

    if (depth > 0) current += ch;
  }

  return { table, columns, tuples };
}

function resolveSetExpression(expr, vars) {
  const clean = expr.trim().replace(/;$/, "");

  if (/^@\w+$/i.test(clean)) {
    return vars.get(clean.toLowerCase()) ?? null;
  }

  if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
    return decodeSqlString(clean);
  }

  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    return Number(clean);
  }

  if (/^NULL$/i.test(clean)) {
    return null;
  }

  return clean;
}

function normalizeId(value) {
  if (value == null) return value;
  const num = Number(value);
  if (Number.isFinite(num) && String(num) === String(value)) return num;
  return value;
}

async function resolveChapterLookupSet(stmt, vars, db) {
  const match = stmt.match(/^SET\s+@(\w+)\s*=\s*\((SELECT[\s\S]+)\)$/i);
  if (!match) return false;

  const varName = `@${match[1].toLowerCase()}`;
  const selectExpr = match[2];
  if (!/FROM\s+chapters/i.test(selectExpr) || !/SELECT\s+id/i.test(selectExpr)) return false;

  const subjectMatch = selectExpr.match(/subject_id\s*=\s*(@\w+|\d+)/i);
  const gradeMatch = selectExpr.match(/grade\s*=\s*(@\w+|\d+)/i);
  const orderMatch = selectExpr.match(/order_num\s*=\s*(@\w+|\d+)/i);

  const subjectRaw = subjectMatch?.[1];
  const gradeRaw = gradeMatch?.[1];
  const orderRaw = orderMatch?.[1];

  const subjectId = subjectRaw ? resolveToken(subjectRaw, vars) : null;
  const grade = gradeRaw ? resolveToken(gradeRaw, vars) : null;
  const orderNum = orderRaw ? resolveToken(orderRaw, vars) : null;

  const query = {};
  if (subjectId != null) query.subject_id = subjectId;
  if (grade != null) query.grade = grade;
  if (orderNum != null) query.order_num = orderNum;

  const chapter = await db.collection("chapters").findOne(query, { projection: { id: 1 } });
  vars.set(varName, chapter?.id ?? null);
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  const db = mongoose.connection.db;

  if (args.drop) {
    await db.dropDatabase();
    console.log("Dropped MongoDB database before seeding.");
  }

  const files = args.files
    ? args.files.map((name) => path.resolve(args.sqlDir, name))
    : (await fs.readdir(args.sqlDir))
        .filter((name) => name.toLowerCase().endsWith(".sql"))
        .map((name) => path.resolve(args.sqlDir, name))
        .sort();

  const vars = new Map();
  const counters = new Map();
  const imported = new Map();

  const getMaxId = async (collectionName) => {
    if (counters.has(collectionName)) return counters.get(collectionName);
    const [agg] = await db
      .collection(collectionName)
      .aggregate([
        { $match: { id: { $type: "number" } } },
        { $group: { _id: null, maxId: { $max: "$id" } } },
      ])
      .toArray();
    const maxId = agg?.maxId || 0;
    counters.set(collectionName, maxId);
    return maxId;
  };

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const content = stripComments(raw);
    const statements = splitSqlStatements(content);

    console.log(`Processing ${path.basename(filePath)} (${statements.length} statements)`);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      if (/^SET\s+@/i.test(trimmed)) {
        const handledLookup = await resolveChapterLookupSet(trimmed, vars, db);
        if (handledLookup) continue;

        const setMatch = trimmed.match(/^SET\s+@(\w+)\s*=\s*([\s\S]+)$/i);
        if (setMatch) {
          const key = `@${setMatch[1].toLowerCase()}`;
          const value = resolveSetExpression(setMatch[2], vars);
          vars.set(key, value);
        }
        continue;
      }

      if (!/^INSERT\s+INTO/i.test(trimmed)) continue;

      const parsed = parseInsertStatement(trimmed);
      if (!parsed) continue;

      const { table, columns, tuples } = parsed;
      const collectionName = table;
      const collection = db.collection(collectionName);

      let tableCount = imported.get(collectionName) || 0;

      for (const tuple of tuples) {
        const rawValues = splitTopLevel(tuple, ",");
        const row = {};

        for (let i = 0; i < columns.length; i += 1) {
          const col = columns[i];
          const token = rawValues[i] ?? "NULL";
          row[col] = resolveToken(token, vars);
        }

        if (row.id == null) {
          let maxId = await getMaxId(collectionName);
          maxId += 1;
          counters.set(collectionName, maxId);
          row.id = maxId;
        } else {
          row.id = normalizeId(row.id);
          if (typeof row.id === "number") {
            const maxId = await getMaxId(collectionName);
            if (row.id > maxId) counters.set(collectionName, row.id);
          }
        }

        await collection.updateOne({ id: row.id }, { $set: row }, { upsert: true });
        tableCount += 1;
      }

      imported.set(collectionName, tableCount);
    }
  }

  for (const [collectionName, maxId] of counters.entries()) {
    if (typeof maxId === "number" && maxId > 0) {
      await db.collection("counters").updateOne(
        { key: collectionName },
        { $set: { key: collectionName, value: maxId } },
        { upsert: true }
      );
    }
  }

  console.log("\nSeed summary:");
  for (const [table, count] of [...imported.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`- ${table}: ${count} row(s) processed`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
