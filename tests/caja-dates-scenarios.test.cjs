// tests/caja-dates-scenarios.test.cjs
// Tests for America/Asuncion date boundaries, yesterday-to-today carryovers, and cash flow
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

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

async function runDateScenarios() {
  console.log('======================================================================');
  console.log('🕐 PROBANDO ESCENARIOS DE FECHAS EN AMERICA/ASUNCION Y CAJA');
  console.log('======================================================================\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  const testId = Date.now().toString().slice(-6);
  const userId = `usr_date_${testId}`;
  let bizId = null;

  try {
    // 1. Setup test business
    await client.query(
      `INSERT INTO "user" (id, name, email, email_verified) VALUES ($1, 'Date Test Owner', $2, true)`,
      [userId, `date_test_${testId}@lavaya.py`]
    );
    const bRes = await client.query(
      `INSERT INTO public.businesses (name, owner_id) VALUES ('Lavadero Fechas Test', $1) RETURNING id`,
      [userId]
    );
    bizId = bRes.rows[0].id;

    // Helper to get Asuncion today string
    const asuncionTodayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Asuncion',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    console.log(`Fecha de hoy en America/Asuncion: ${asuncionTodayStr}`);

    // ESCENARIO 1: Vehículo que ingresó AYER y queda lavando al cambiar el día
    console.log('\nESCENARIO 1: Vehículo ingresado ayer a las 23:30 que aún sigue lavando hoy...');
    await client.query(
      `INSERT INTO public.wash_jobs 
        (business_id, plate, tipo, service, amount, state, payment_method, token_publico, created_at)
       VALUES 
        ($1, 'AYER 001', 'auto', 'Lavado Nocturno', 70000, 'lavando', NULL, $2, (NOW() - INTERVAL '1 day'))`,
      [bizId, `tk_d_${testId}_1`]
    );

    // Verify count in pista (WITHOUT date limit)
    const enPistaRes = await client.query(
      `SELECT COUNT(CASE WHEN state IN ('espera', 'lavando', 'listo') THEN 1 END) AS en_pista_actual
       FROM public.wash_jobs WHERE business_id = $1`,
      [bizId]
    );
    assert.equal(Number(enPistaRes.rows[0].en_pista_actual), 1, 'El auto de ayer en lavado debe contarse en pista hoy');
    console.log('   ✓ Superado: El auto ingresado ayer figura en la pista activa hoy.');

    // ESCENARIO 2: Vehículo entregado AYER con pago pendiente y todavía no saldado
    console.log('\nESCENARIO 2: Vehículo entregado ayer con pago pendiente (deuda viva hoy)...');
    const jobAyerPendRes = await client.query(
      `INSERT INTO public.wash_jobs 
        (business_id, plate, tipo, service, amount, state, payment_method, token_publico, created_at, entregado_en)
       VALUES 
        ($1, 'DEUDA 002', 'auto', 'Lavado Completo', 50000, 'entregado', 'pendiente', $2, (NOW() - INTERVAL '1 day'), (NOW() - INTERVAL '1 day'))
       RETURNING id`,
      [bizId, `tk_d_${testId}_2`]
    );
    const jobAyerPendId = jobAyerPendRes.rows[0].id;

    // Query 2a: Total pendiente vigente (debe incluirlo)
    const allPendingRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_pendiente_vigente, COUNT(id) AS cantidad
       FROM public.wash_jobs WHERE business_id = $1 AND state = 'entregado' AND payment_method = 'pendiente'`,
      [bizId]
    );
    assert.equal(Number(allPendingRes.rows[0].total_pendiente_vigente), 50000);
    assert.equal(Number(allPendingRes.rows[0].cantidad), 1);

    // Query 2b: Pendiente originado en el período de hoy (NO debe incluirlo porque se originó ayer)
    const todayPendingRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_pendiente_periodo
       FROM public.wash_jobs 
       WHERE business_id = $1 AND state = 'entregado' AND payment_method = 'pendiente'
         AND (created_at AT TIME ZONE 'America/Asuncion')::date = $2::date`,
      [bizId, asuncionTodayStr]
    );
    assert.equal(Number(todayPendingRes.rows[0].total_pendiente_periodo), 0);
    console.log('   ✓ Superado: La deuda de ayer está en los pendientes totales vigentes (₲ 50.000), pero no en los originados hoy.');

    // ESCENARIO 3: Trabajo de ayer cobrado HOY
    console.log('\nESCENARIO 3: Cobro asentado hoy sobre el trabajo entregado ayer...');
    // Settling payment today
    await client.query(
      `UPDATE public.wash_jobs SET payment_method = 'efectivo' WHERE id = $1 AND business_id = $2`,
      [jobAyerPendId, bizId]
    );
    await client.query(
      `INSERT INTO public.payments (business_id, job_id, monto, medio, created_at)
       VALUES ($1, $2, 50000, 'efectivo', NOW())`,
      [bizId, jobAyerPendId]
    );

    // Query today's payments in America/Asuncion
    const todayCobrosRes = await client.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN medio = 'efectivo' THEN monto ELSE 0 END), 0) AS total_efectivo,
         COALESCE(SUM(monto), 0) AS total_cobrado
       FROM public.payments
       WHERE business_id = $1 
         AND (created_at AT TIME ZONE 'America/Asuncion')::date = $2::date`,
      [bizId, asuncionTodayStr]
    );
    assert.equal(Number(todayCobrosRes.rows[0].total_cobrado), 50000);
    assert.equal(Number(todayCobrosRes.rows[0].total_efectivo), 50000);

    // Verify total pendiente vigente is now 0
    const pendingAfterSettle = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_pendiente_vigente
       FROM public.wash_jobs WHERE business_id = $1 AND state = 'entregado' AND payment_method = 'pendiente'`,
      [bizId]
    );
    assert.equal(Number(pendingAfterSettle.rows[0].total_pendiente_vigente), 0);
    console.log('   ✓ Superado: El cobro recibido hoy de un trabajo de ayer entra a la caja de hoy y anula la deuda pendiente.');

    // ESCENARIO 4: Movimientos cercanos a medianoche en America/Asuncion
    console.log('\nESCENARIO 4: Validación de límites de medianoche en America/Asuncion...');
    // Let's test a timestamp that in UTC is next day, but in Asuncion is today:
    // e.g. 23:50 Asunción time is UTC-3, so UTC is 02:50 next day!
    const timezoneCheck = await client.query(
      `SELECT 
         ('2026-11-06 23:55:00-03'::timestamptz AT TIME ZONE 'America/Asuncion')::date AS date_asuncion,
         ('2026-11-06 23:55:00-03'::timestamptz AT TIME ZONE 'UTC')::date AS date_utc`
    );
    assert.equal(timezoneCheck.rows[0].date_asuncion.toISOString().slice(0, 10), '2026-11-06');
    assert.equal(timezoneCheck.rows[0].date_utc.toISOString().slice(0, 10), '2026-11-07');
    console.log('   ✓ Superado: A las 23:55 hora paraguaya, la fecha se mantiene correctamente en el día actual (no se adelanta a UTC).');

  } finally {
    console.log('\n🧹 Limpiando registros del test de fechas...');
    if (bizId) {
      await client.query(`DELETE FROM public.businesses WHERE id = $1`, [bizId]);
    }
    await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
    client.release();
    await pool.end();
  }

  console.log('\n======================================================================');
  console.log('✅ TODOS LOS ESCENARIOS DE FECHAS Y CAJA PASARON SATISFACTORIAMENTE');
  console.log('======================================================================');
}

runDateScenarios().catch(err => {
  console.error('❌ FALLO:', err);
  process.exit(1);
});
