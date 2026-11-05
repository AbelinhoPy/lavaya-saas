// scripts/migrate.cjs
const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');

// Automatically read .env.local if DATABASE_URL is not in process.env
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (!process.env.DATABASE_URL && fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL no está configurada en el entorno ni en .env.local.');
    console.warn('   Para aplicar migraciones en Neon, ejecutá:');
    console.warn('   $env:DATABASE_URL="postgres://..." ; npm run db:migrate');
    return;
  }

  console.log('🔄 Conectando a Neon PostgreSQL...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public._migrations (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        console.log('No hay directorio de migraciones.');
        return;
      }

      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const { rows } = await client.query('SELECT 1 FROM public._migrations WHERE name = $1', [file]);
        if (rows.length > 0) {
          console.log(`✓ Ya aplicada: ${file}`);
          continue;
        }

        console.log(`⏳ Aplicando: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO public._migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Aplicada con éxito: ${file}`);
      }

      console.log('🎉 Todas las migraciones están al día en Neon.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error aplicando migraciones:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
