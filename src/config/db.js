const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('./index');

// Ensure database directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Instantiate SQLite synchronous database
const db = new DatabaseSync(config.DB_PATH);

/**
 * Initialize all database tables and indexes
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      lead_name TEXT NOT NULL,
      user_count INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT,
      title TEXT,
      bio TEXT,
      skills TEXT,
      learning_style TEXT,
      status TEXT DEFAULT 'active',
      is_lead INTEGER DEFAULT 0,
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      member_count INTEGER DEFAULT 4,
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      sprint_num INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      member_name TEXT NOT NULL,
      member_role TEXT,
      start_time TEXT,
      deadline_time TEXT,
      completed_at TEXT,
      status TEXT DEFAULT 'pending',
      is_before_deadline INTEGER DEFAULT 0,
      est_hours REAL DEFAULT 1.5,
      act_hours REAL DEFAULT 1.5,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT,
      original_name TEXT,
      filesize TEXT,
      is_folder INTEGER DEFAULT 0,
      is_shared INTEGER DEFAULT 0,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      from_name TEXT NOT NULL,
      to_name TEXT NOT NULL,
      item TEXT NOT NULL,
      reason TEXT,
      type TEXT DEFAULT 'work',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      sender_name TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      message TEXT NOT NULL,
      mode TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sprint_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      sprint_num INTEGER DEFAULT 1,
      status TEXT DEFAULT 'published',
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replan_reason TEXT
    );
  `);
}

module.exports = {
  db,
  initDatabase
};
