const { Pool } = require('@neondatabase/serverless');
const path = require('path');
const fs = require('fs');

const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const sessions = await pool.query(`SELECT id, business_id, status, opened_at FROM public.cash_sessions`);
  console.log('Sessions count:', sessions.rows.length);

  const payments = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'`);
  console.log('Payments columns:', payments.rows.map(r => r.column_name));

  const expenses = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'expenses'`);
  console.log('Expenses columns:', expenses.rows.map(r => r.column_name));

  const stockItems = await pool.query(`SELECT count(*) as count FROM public.stock_items`);
  console.log('Stock items in DB:', stockItems.rows[0].count);

  await pool.end();
}

run().catch(console.error);
