import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DB_PATH ?? path.join("data", "agent-rtc.db");

// Ensure directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db: DatabaseType = new Database(dbPath);

// WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// --- Schema migration ---

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      agentId TEXT PRIMARY KEY,
      displayName TEXT NOT NULL DEFAULT 'Agent',
      lastHeartbeat INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      toAgentId TEXT NOT NULL,
      fromAgentId TEXT NOT NULL,
      fromDisplayName TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      timestamp INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS masters (
      agentId TEXT PRIMARY KEY
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS message_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromAgentId TEXT NOT NULL,
      fromDisplayName TEXT NOT NULL DEFAULT '',
      toAgentId TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      timestamp INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Future columns — add safely
  const addColumn = (table: string, column: string, type: string, defaultVal: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultVal}`);
    } catch {
      // Column already exists — ignore
    }
  };

  // Example for future use:
  // addColumn("agents", "metadata", "TEXT", "'{}'");
  void addColumn; // prevent unused warning
}

migrate();

export default db;
