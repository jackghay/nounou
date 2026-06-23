import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  console.log("Connecting to database for migrations...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected successfully.");

    // Relative path to migrations is '../migrations' since both src/ and dist/ are siblings to migrations/
    const migrationsDir = path.join(__dirname, "../migrations");
    console.log(`Reading migrations from: ${migrationsDir}`);
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Migration ${file} completed successfully.`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Error in migration ${file}:`, err);
        throw err;
      }
    }

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
