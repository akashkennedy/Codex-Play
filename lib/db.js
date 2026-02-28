import { Pool } from 'pg';

const globalForDb = globalThis;

const pool =
  globalForDb.expensePool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.expensePool = pool;
}

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      currency TEXT NOT NULL,
      country TEXT NOT NULL,
      category TEXT,
      note TEXT,
      occurred_at DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses (created_at DESC);');
  initialized = true;
}

export { pool };
