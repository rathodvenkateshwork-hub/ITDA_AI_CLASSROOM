import "dotenv/config";
import pg from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pg;

const SUPABASE_URL = process.env.SUPABASE_URL;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;

if (!SUPABASE_URL || !DATABASE_PASSWORD) {
  console.error("❌ SUPABASE_URL and DATABASE_PASSWORD are required in .env");
  process.exit(1);
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.split("//")[1].split(".")[0];

// Build PostgreSQL connection string
const connectionString = `postgresql://postgres:${DATABASE_PASSWORD}@${projectRef}.supabase.co:5432/postgres`;

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sqlFile = path.join(__dirname, "..", "database", "supabase-migration.sql");

    console.log("📖 Reading migration SQL...");
    const sqlContent = await fs.readFile(sqlFile, "utf-8");

    console.log("🔌 Connecting to Supabase PostgreSQL...");
    await client.connect();
    console.log("✅ Connected!");

    // Split and execute statements
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    console.log(`\n📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        const desc = stmt.substring(0, 60).replace(/\n/g, " ");
        console.log(`[${i + 1}/${statements.length}] ✓ ${desc}...`);
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes("already exists") || err.message.includes("duplicate key")) {
          console.log(`[${i + 1}/${statements.length}] ⚠️  ${err.message.substring(0, 60)}`);
        } else {
          console.error(`[${i + 1}/${statements.length}] ❌ Error: ${err.message}`);
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("🎉 Your Supabase database is now ready!\n");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
