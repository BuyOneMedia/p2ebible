import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = process.env.DATABASE_PATH || './p2ebible.db';
const migrationPath = path.join(__dirname, '../migrations/001_initial.sql');

console.log(`[migrate] Opening database at: ${dbPath}`);
const db = new Database(dbPath);

const sql = fs.readFileSync(migrationPath, 'utf-8');

try {
  db.exec(sql);
  console.log('[migrate] ✓ Migration completed successfully');
} catch (err) {
  console.error('[migrate] ✗ Migration failed:', err);
  process.exit(1);
} finally {
  db.close();
}
