const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'player' -- 'dm' or 'player'
    )
  `);

  // Campaigns
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dm_id INTEGER NOT NULL,
      FOREIGN KEY(dm_id) REFERENCES users(id)
    )
  `);

  // Characters (5e base)
  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      campaign_id INTEGER,
      name TEXT NOT NULL,
      class TEXT,
      level INTEGER DEFAULT 1,
      background TEXT,
      race TEXT,
      alignment TEXT,
      xp INTEGER DEFAULT 0,

      -- Stats (JSON format to store everything easily for MVP)
      attributes TEXT,
      skills TEXT,
      combat TEXT,
      equipment TEXT,
      roleplay TEXT,
      spells TEXT,

      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Maps
  db.run(`
    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      grid_size INTEGER DEFAULT 50,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL,
      character_id INTEGER,
      x INTEGER DEFAULT 0,
      y INTEGER DEFAULT 0,
      image_url TEXT,
      FOREIGN KEY(map_id) REFERENCES maps(id),
      FOREIGN KEY(character_id) REFERENCES characters(id)
    )
  `);

  console.log("Database initialized successfully.");
});

db.close();
