import 'server-only';
import { Pool, neon } from '@neondatabase/serverless';

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no configurada en las variables de entorno.');
  }
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return poolInstance;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
}

/**
 * Execute a parameterized SQL query safely against Neon PostgreSQL.
 * Never concatenate unescaped user input into queries.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!isDbConfigured()) {
    throw new Error('Servicio de base de datos todavía no configurado. Podés explorar la demo sin registrarte.');
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Run operations within a database transaction on Neon.
 */
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  if (!isDbConfigured()) {
    throw new Error('Servicio de base de datos todavía no configurado.');
  }
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
