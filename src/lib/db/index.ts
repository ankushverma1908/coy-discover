import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { seed } from './seed';

export type DB = Database.Database;
export const DB_PATH = process.env.COY_DB_PATH ?? path.join(process.cwd(), 'data', 'coy.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER NOT NULL, photo_url TEXT NOT NULL,
  bio TEXT NOT NULL, location TEXT NOT NULL, interests_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS swipes (
  user_id TEXT NOT NULL, profile_id INTEGER NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('like','pass')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, profile_id)
);
-- Seeded people who liked "me". PRIVATE: only read inside the swipe transaction.
CREATE TABLE IF NOT EXISTS incoming_likes (
  profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, profile_id)
);`;

/** Opens a DB, ensures schema, and seeds if empty. Use ':memory:' in tests. */
export function createDb(file: string = DB_PATH): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  const { c } = db.prepare('SELECT COUNT(*) c FROM profiles').get() as { c: number };
  if (c === 0) seed(db);
  return db;
}

const g = globalThis as unknown as { __coyDb?: DB };
export function getDb(): DB {
  return (g.__coyDb ??= createDb());
}
