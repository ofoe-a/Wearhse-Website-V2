import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('✗ PostgreSQL connection error:', err);
    process.exit(-1);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export default pool;
