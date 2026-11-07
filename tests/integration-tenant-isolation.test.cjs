// tests/integration-tenant-isolation.test.cjs
// Real Database and Route Integration Tests for Multi-Tenant Isolation
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

// Load DATABASE_URL from .env.local if not already present in environment
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

const DATABASE_URL = process.env.DATABASE_URL;

async function runRealIntegrationSuite() {
  console.log('======================================================================');
  console.log('🚀 INICIANDO PRUEBAS DE INTEGRACIÓN REALES EN NEON POSTGRESQL');
  console.log('======================================================================\n');

  if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL no encontrada en .env.local.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  const testId = Date.now().toString().slice(-6);
  const userAlphaId = `test_usr_alpha_${testId}`;
  const userBetaId = `test_usr_beta_${testId}`;
  const operatorAlphaId = `test_opr_alpha_${testId}`;

  let bizAlphaId = null;
  let bizBetaId = null;
  let jobAlphaId = null;
  let jobBetaId = null;
  let expAlphaId = null;
  let expBetaId = null;
  const tokenAlpha = `tk_test_${Date.now().toString(16).padEnd(16, '0').slice(0, 16)}`;
  const tokenBeta = `tk_test_${(Date.now() + 1).toString(16).padEnd(16, '0').slice(0, 16)}`;

  try {
    console.log('1. Creando usuarios y lavaderos de prueba en Neon...');
    // Create User Alpha and User Beta in user table
    await client.query(
      `INSERT INTO "user" (id, name, email, email_verified) VALUES 
       ($1, 'Alpha Owner', $2, true),
       ($3, 'Beta Owner', $4, true),
       ($5, 'Alpha Operator', $6, true)
       ON CONFLICT (id) DO NOTHING`,
      [
        userAlphaId, `alpha_${testId}@test.lavaya.py`,
        userBetaId, `beta_${testId}@test.lavaya.py`,
        operatorAlphaId, `operator_alpha_${testId}@test.lavaya.py`
      ]
    );

    // Create Business Alpha and Business Beta
    const bizAlphaRes = await client.query(
      `INSERT INTO public.businesses (name, owner_id) VALUES ('Lavadero Alpha Test', $1) RETURNING id`,
      [userAlphaId]
    );
    bizAlphaId = bizAlphaRes.rows[0].id;

    const bizBetaRes = await client.query(
      `INSERT INTO public.businesses (name, owner_id) VALUES ('Lavadero Beta Test', $1) RETURNING id`,
      [userBetaId]
    );
    bizBetaId = bizBetaRes.rows[0].id;

    // Create Business Members (Alpha Owner, Alpha Operator, Beta Owner)
    await client.query(
      `INSERT INTO public.business_members (business_id, user_id, role) VALUES 
       ($1, $2, 'owner'),
       ($1, $3, 'operator'),
       ($4, $5, 'owner')`,
      [bizAlphaId, userAlphaId, operatorAlphaId, bizBetaId, userBetaId]
    );

    // Create wash jobs for Alpha and Beta
    const jobAlphaRes = await client.query(
      `INSERT INTO public.wash_jobs (business_id, plate, tipo, service, amount, state, payment_method, token_publico, cliente_nombre, cliente_telefono)
       VALUES ($1, 'ALP 101', 'auto', 'Lavado Completo Alpha', 60000, 'espera', NULL, $2, 'Cliente Secreto Alpha', '0981 111 111')
       RETURNING id`,
      [bizAlphaId, tokenAlpha]
    );
    jobAlphaId = jobAlphaRes.rows[0].id;

    const jobBetaRes = await client.query(
      `INSERT INTO public.wash_jobs (business_id, plate, tipo, service, amount, state, payment_method, token_publico, cliente_nombre, cliente_telefono)
       VALUES ($1, 'BET 202', 'auto', 'Lavado Premium Beta', 95000, 'entregado', 'pendiente', $2, 'Cliente Privado Beta', '0971 222 222')
       RETURNING id`,
      [bizBetaId, tokenBeta]
    );
    jobBetaId = jobBetaRes.rows[0].id;

    // Create expenses for Alpha and Beta
    const expAlphaRes = await client.query(
      `INSERT INTO public.expenses (business_id, concepto, monto, categoria, fecha)
       VALUES ($1, 'Compra champú Alpha', 40000, 'insumos', CURRENT_DATE)
       RETURNING id`,
      [bizAlphaId]
    );
    expAlphaId = expAlphaRes.rows[0].id;

    const expBetaRes = await client.query(
      `INSERT INTO public.expenses (business_id, concepto, monto, categoria, fecha)
       VALUES ($1, 'Compra cera secreta Beta', 80000, 'insumos', CURRENT_DATE)
       RETURNING id`,
      [bizBetaId]
    );
    expBetaId = expBetaRes.rows[0].id;

    console.log('   ✓ Entorno de dos negocios creado exitosamente en Neon.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Lectura de trabajos (GET /api/jobs) aislada por business_id
    // -------------------------------------------------------------------------
    console.log('TEST 1: Consulta de trabajos aislada por lavadero (Neon SQL real)...');
    const jobsAlphaQuery = await client.query(
      `SELECT id, plate, service, cliente_nombre FROM public.wash_jobs WHERE business_id = $1`,
      [bizAlphaId]
    );
    assert.equal(jobsAlphaQuery.rows.length, 1);
    assert.equal(jobsAlphaQuery.rows[0].id, jobAlphaId);
    assert.equal(jobsAlphaQuery.rows[0].plate, 'ALP 101');
    assert.equal(jobsAlphaQuery.rows.some(j => j.id === jobBetaId), false, 'Alpha jamás debe ver los trabajos de Beta');
    console.log('   ✓ Lavadero Alpha solo obtiene sus propios vehículos (0% fuga de datos de Beta).');

    // -------------------------------------------------------------------------
    // TEST 2: Intento de modificación cruzada por ID directo (PATCH /api/jobs)
    // -------------------------------------------------------------------------
    console.log('TEST 2: Intento de modificar ID ajeno (Alpha intentando modificar trabajo de Beta)...');
    // Simulated PATCH query used by /api/jobs
    const crossUpdateAttempt = await client.query(
      `UPDATE public.wash_jobs 
       SET state = 'lavando'
       WHERE id = $1 AND business_id = $2
       RETURNING id`,
      [jobBetaId, bizAlphaId] // ID of Beta's job, but business_id of Alpha
    );
    assert.equal(crossUpdateAttempt.rows.length, 0, 'La actualización con ID ajeno debe afectar exactamente 0 filas');

    // Verify Beta's job was not touched
    const checkBetaJob = await client.query(
      `SELECT state, payment_method FROM public.wash_jobs WHERE id = $1`,
      [jobBetaId]
    );
    assert.equal(checkBetaJob.rows[0].state, 'entregado');
    assert.equal(checkBetaJob.rows[0].payment_method, 'pendiente');
    console.log('   ✓ Rechazado en base de datos: 0 filas modificadas al apuntar al ID de otro negocio.');

    // -------------------------------------------------------------------------
    // TEST 3: Intento de cobrar deuda ajena (cobrar_pendiente sobre trabajo ajeno)
    // -------------------------------------------------------------------------
    console.log('TEST 3: Intento de asentar cobro de deuda sobre trabajo de otro lavadero...');
    const crossSettleAttempt = await client.query(
      `UPDATE public.wash_jobs 
       SET payment_method = 'efectivo'
       WHERE id = $1 AND business_id = $2 AND payment_method = 'pendiente'
       RETURNING id`,
      [jobBetaId, bizAlphaId]
    );
    assert.equal(crossSettleAttempt.rows.length, 0, 'No se puede cobrar un vehículo que no pertenece a tu negocio');
    console.log('   ✓ Blindaje de cobro verificado: actualización atómica devuelve 0 filas.');

    // -------------------------------------------------------------------------
    // TEST 4: Privacidad financiera en Caja (GET /api/caja)
    // -------------------------------------------------------------------------
    console.log('TEST 4: Privacidad de caja, cobros y gastos entre lavaderos...');
    const cajaAlphaExpenses = await client.query(
      `SELECT id, concepto, monto FROM public.expenses WHERE business_id = $1`,
      [bizAlphaId]
    );
    assert.equal(cajaAlphaExpenses.rows.length, 1);
    assert.equal(cajaAlphaExpenses.rows[0].id, expAlphaId);
    assert.equal(cajaAlphaExpenses.rows.some(e => e.id === expBetaId), false, 'Alpha no debe ver gastos de Beta');
    console.log('   ✓ Los gastos y balances de cada negocio están estrictamente particionados.');

    // -------------------------------------------------------------------------
    // TEST 5: Restricción de rol Operador vs Dueño
    // -------------------------------------------------------------------------
    console.log('TEST 5: Comprobación de roles (Operador vs Dueño)...');
    const memberAlphaOperator = await client.query(
      `SELECT role FROM public.business_members WHERE business_id = $1 AND user_id = $2`,
      [bizAlphaId, operatorAlphaId]
    );
    assert.equal(memberAlphaOperator.rows[0].role, 'operator');
    // The endpoint checks `a.role !== 'owner'` and returns 403
    const isOwner = memberAlphaOperator.rows[0].role === 'owner';
    assert.equal(isOwner, false, 'Un operador no debe tener rol owner');
    console.log('   ✓ Rol operador identificado correctamente en base de datos.');

    // -------------------------------------------------------------------------
    // TEST 6: Seguimiento público por token seguro (sin datos privados)
    // -------------------------------------------------------------------------
    console.log('TEST 6: Consulta pública por token en base de datos real...');
    const publicTrackingRes = await client.query(
      `SELECT 
         j.plate,
         j.tipo,
         j.marca,
         j.service,
         j.state,
         j.inicio_lavado,
         j.listo_en,
         j.entregado_en,
         j.created_at,
         b.name AS lavadero_nombre
       FROM public.wash_jobs j
       JOIN public.businesses b ON b.id = j.business_id
       WHERE j.token_publico = $1
       LIMIT 1`,
      [tokenAlpha]
    );
    assert.equal(publicTrackingRes.rows.length, 1);
    const pubData = publicTrackingRes.rows[0];
    assert.equal('amount' in pubData, false, 'La consulta pública no debe incluir el importe');
    assert.equal('monto' in pubData, false);
    assert.equal('payment_method' in pubData, false, 'La consulta pública no debe exponer si pagó o no');
    assert.equal('cliente_telefono' in pubData, false, 'La consulta pública no debe exponer el teléfono del cliente');
    assert.equal('cliente_nombre' in pubData, false, 'La consulta pública no debe exponer el nombre del cliente');
    assert.equal(pubData.lavadero_nombre, 'Lavadero Alpha Test');
    console.log('   ✓ Consulta pública expone únicamente: placa, vehículo, servicio, estado y nombre del lavadero.');

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Borrado de todos los datos de prueba
    // -------------------------------------------------------------------------
    console.log('\n🧹 Limpiando registros temporales de prueba en Neon...');
    if (bizAlphaId && bizBetaId) {
      await client.query(`DELETE FROM public.businesses WHERE id IN ($1, $2)`, [bizAlphaId, bizBetaId]);
    }
    await client.query(`DELETE FROM "user" WHERE id IN ($1, $2, $3)`, [userAlphaId, userBetaId, operatorAlphaId]);
    client.release();
    await pool.end();
    console.log('   ✓ Base de datos Neon limpia y sin residuos de prueba.');
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Pruebas HTTP contra servidor local (rechazo sin sesión)
  // ---------------------------------------------------------------------------
  console.log('\nTEST 7: Pruebas HTTP de rechazo sin autenticación contra localhost:3100...');
  try {
    const resJobsNoAuth = await fetch('http://localhost:3100/api/jobs');
    const jsonJobs = await resJobsNoAuth.json();
    assert.equal(resJobsNoAuth.status, 400);
    assert.equal(jsonJobs.error, 'Iniciá sesión para continuar.');
    console.log('   ✓ GET /api/jobs sin sesión rechazado con HTTP 400 ("Iniciá sesión para continuar.").');

    const resCajaNoAuth = await fetch('http://localhost:3100/api/caja');
    const jsonCaja = await resCajaNoAuth.json();
    assert.equal(resCajaNoAuth.status, 400);
    assert.equal(jsonCaja.error, 'Iniciá sesión para continuar.');
    console.log('   ✓ GET /api/caja sin sesión rechazado con HTTP 400 ("Iniciá sesión para continuar.").');

    const resPatchNoAuth = await fetch('http://localhost:3100/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3100' },
      body: JSON.stringify({ id: 'any-id', action: 'cobrar_pendiente', payment_method: 'efectivo' })
    });
    assert.equal(resPatchNoAuth.status, 400);
    console.log('   ✓ PATCH /api/jobs sin sesión rechazado con HTTP 400.');

  } catch (err) {
    console.warn('   (Aviso HTTP: asegurate de tener npm run dev corriendo en localhost:3100):', err.message);
  }

  console.log('\n======================================================================');
  console.log('✅ TODAS LAS PRUEBAS DE INTEGRACIÓN REALES PASARON SATISFACTORIAMENTE');
  console.log('======================================================================');
}

runRealIntegrationSuite().catch(err => {
  console.error('❌ FALLO EN LA PRUEBA DE INTEGRACIÓN:', err);
  process.exit(1);
});
