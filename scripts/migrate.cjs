// scripts/migrate.cjs
const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL no está configurada en el entorno.');
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
