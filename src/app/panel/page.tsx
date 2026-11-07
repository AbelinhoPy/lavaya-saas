import { redirect } from 'next/navigation';
import { account, authConfigured } from '@/lib/server';
import { hasAccess } from '@/lib/billing-core';
import { query } from '@/lib/db';
import Board from '@/components/board';
import Billing from '@/components/billing';
import { Brand } from '@/components/brand';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Panel del Lavadero · LavaYA!',
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (!authConfigured()) {
    redirect('/ingresar');
  }

  let a;
  try {
    a = await account();
  } catch {
    redirect('/ingresar');
  }

  // 1. Load subscription from Neon PostgreSQL
  const subRows = await query(
    `SELECT status, access_until, paddle_subscription_id, plan_type 
     FROM public.subscriptions 
     WHERE business_id = $1 
     LIMIT 1`,
    [a.business.id]
  );
  const sub = subRows[0];

  const billing = (
    <Billing
      status={sub?.status || 'none'}
      until={sub?.access_until || null}
      subscribed={Boolean(sub?.paddle_subscription_id)}
      planType={sub?.plan_type || 'monthly'}
      enabled={
        process.env.BILLING_ENABLED === 'true' &&
        Boolean(
          process.env.PADDLE_API_KEY &&
            (process.env.PADDLE_PRICE_ID_MONTHLY || process.env.PADDLE_PRICE_ID) &&
            process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
            process.env.PADDLE_WEBHOOK_SECRET
        )
      }
      sandbox={process.env.PADDLE_ENVIRONMENT !== 'production'}
      token={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ''}
    />
  );

  // If in production billing mode and subscription not active, show subscription prompt
  if (process.env.BILLING_ENABLED === 'true' && !hasAccess(sub)) {
    return (
      <main className="app-shell">
        <Brand />
        <div className="section" style={{ maxWidth: 700, margin: '40px auto 0' }}>
          <h1 style={{ fontSize: 36, marginBottom: 12 }}>Hola, {a.business.name}.</h1>
          <p className="lead" style={{ marginBottom: 24 }}>
            Tu cuenta y lavadero están listos en LavaYA!. El tablero operativo se habilita en cuanto el proveedor confirme la activación de tu prueba gratuita de 7 días.
          </p>
          {billing}
          <p className="micro" style={{ marginTop: 20 }}>
            Si completaste el checkout recientemente, esperá unos instantes y recargá la página.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
            <a className="button small" href="/panel">
              Actualizar estado ↻
            </a>
            <a className="subtle" href="/demo">
              Mientras tanto, explorar la demo →
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 2. Load wash jobs for this business from Neon
  const jobs = await query(
    `SELECT id, plate, tipo, marca, service, extras, amount, state, payment_method, token_publico, 
            notas, cliente_nombre, cliente_telefono, inicio_lavado, listo_en, entregado_en, created_at 
     FROM public.wash_jobs 
     WHERE business_id = $1 
     ORDER BY created_at DESC 
     LIMIT 100`,
    [a.business.id]
  );

  // 3. Load services and tariffs for this business
  let services = await query(
    `SELECT id, tipo_vehiculo, categoria, nombre, descripcion, icono, precio, activo 
     FROM public.services 
     WHERE business_id = $1 
     ORDER BY categoria ASC, tipo_vehiculo ASC, precio ASC`,
    [a.business.id]
  );

  if (services.length === 0) {
    await query('SELECT public.seed_default_services($1)', [a.business.id]);
    services = await query(
      `SELECT id, tipo_vehiculo, categoria, nombre, descripcion, icono, precio, activo 
       FROM public.services 
       WHERE business_id = $1 
       ORDER BY categoria ASC, tipo_vehiculo ASC, precio ASC`,
      [a.business.id]
    );
  }

  return (
    <Board
      demo={false}
      title={a.business.name}
      initialJobs={jobs || []}
      initialServices={services || []}
      userRole={a.role}
    >
      {billing}
    </Board>
  );
}
