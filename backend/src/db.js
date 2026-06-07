import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://luhcianoneves:leticia2011@postgres:5432/meustextos',
});

export const initDB = async () => {
  try {
    const sql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Database tables initialized.');
  } catch (err) {
    console.error('Database init error:', err);
    throw err;
  }
};

export default pool;
