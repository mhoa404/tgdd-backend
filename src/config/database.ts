import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString ? connectionString : undefined,
  host: connectionString ? undefined : process.env.DB_HOST,
  user: connectionString ? undefined : process.env.DB_USER,
  password: connectionString ? undefined : process.env.DB_PASS,
  database: connectionString ? undefined : process.env.DB_NAME,
  port: 5432,
  ssl: isProduction || connectionString ? { rejectUnauthorized: false } : false
});

export default pool;
