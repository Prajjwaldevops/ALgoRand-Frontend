import fs from "fs";
import { Client } from "pg";

const connectionString = "postgresql://postgres.fnjdtoishdxfgzpbmsqy:2FTjHBCmlVdP11zM@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
const sqlFile = "../database/migration-better-auth.sql";

const sql = fs.readFileSync(sqlFile, "utf8");

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database");
    await client.query(sql);
    console.log("Migration executed successfully");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
