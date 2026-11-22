// Database connection. Exports { query, init }.
// - DATABASE_URL set  -> PostgreSQL through pg (use this when hosted; data survives restarts).
// - DATABASE_URL empty -> local SQLite file through Node's built-in node:sqlite (Node 22.5+).
// Both accept $1, $2 ... placeholders and return { rows, rowCount }.
const fs = require("fs");
const path = require("path");

const read = name => fs.readFileSync(path.join(__dirname, name), "utf8");
let query;
let dialect;

if (process.env.DATABASE_URL) {
  dialect = "postgres";
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Render external URLs need SSL; set DATABASE_SSL=false for a local PostgreSQL.
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
  });
  query = (text, params = []) => pool.query(text, params);
} else {
  dialect = "sqlite";
  const { DatabaseSync } = require("node:sqlite");
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
  const db = new DatabaseSync(path.join(__dirname, "data", "records.db"));
  query = async (text, params = []) => {
    const sql = text.replace(/\$(\d+)/g, "?$1"); // $1 -> ?1
    const stmt = db.prepare(sql);
    if (/^\s*select/i.test(sql) || /\breturning\b/i.test(sql)) {
      const rows = stmt.all(...params).map(r => ({ ...r }));
      return { rows, rowCount: rows.length };
    }
    const info = stmt.run(...params);
    return { rows: [], rowCount: Number(info.changes) };
  };
  // allow multi-statement scripts (schema / seed)
  query.exec = sql => db.exec(sql);
}

async function init() {
  const schema = read(dialect === "postgres" ? "schema.sql" : "schema.sqlite.sql");
  const seed = read("seed.sql");
  if (dialect === "postgres") {
    await query(schema);
  } else {
    query.exec(schema);
  }
  const count = await query("SELECT COUNT(*) AS n FROM records");
  if (Number(count.rows[0].n) === 0) {
    if (dialect === "postgres") await query(seed);
    else query.exec(seed);
    console.log("Inserted starting records.");
  }
  console.log(`Database ready (${dialect}).`);
}

module.exports = { query, init, dialect };
