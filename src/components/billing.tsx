'use client';
import { useState } from 'react';
import Script from 'next/script';
import { PlanType, PLANS } from '@/lib/plans';

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (args: any) => void;
      Checkout: { open: (args: any) => void };
    };
  }
}

export default function Billing({
  status,
  until,
  enabled,
  subscribed,
  planType = 'monthly',
  sandbox,
  token,
}: {
  status: string;
  until: string | null;
  enabled: boolean;
  subscribed: boolean;
  planType?: string;
  sandbox: boolean;
  token: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const plan = PLANS[selectedPlan];

  async function action() {
    setBusy(true);
    setMessage('');
    try {
      const endpoint = subscribed ? '/api/billing/portal' : '/api/billing/checkout';
      const body = subscribed ? {} : { consent, plan: selectedPlan };

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No pudimos procesar la solicitud.');

      if (d.url) {
        window.location.assign(d.url);
      } else if (d.transactionId && window.Paddle) {
        window.Paddle.Checkout.open({
          transactionId: d.transactionId,
          settings: {
            locale: 'es',
            successUrl: `${window.location.origin}/panel?billing=success`,
          },
        });
      } else if (d.transactionId) {
        setMessage('Checkout preparado. Aguardá unos segundos mientras carga el formulario.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No pudimos abrir el pago.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="billing-panel">
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 19 }}>
              {status === 'trialing'
                ? 'Tus 7 días de prueba están en marcha 🚀'
                : status === 'active'
                ? 'Tu suscripción a LavaYA! está activa ✅'
                : subscribed
                ? 'Gestioná tu suscripción'
                : 'Activá LavaYA! para tu lavadero'}
            </h3>
            {subscribed && planType && (
              <span className="pill" style={{ background: '#dcecd2', color: '#1f4837' }}>
                {planType === 'annual' ? 'Anual' : planType === 'semiannual' ? 'Semestral' : 'Mensual'}
              </span>
            )}
          </div>

          <p>
            {until
              ? `Período actual con acceso hasta el ${new Date(until).toLocaleDateString('es-PY', {
                  timeZone: 'UTC',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}. `
              : ''}
            7 días de prueba gratis con tarjeta para nuevos clientes. Al finalizar la prueba, se factura el período seleccionado más impuestos aplicables.
          </p>

          {!subscribed && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#b2c8b8', display: 'block', marginBottom: 8 }}>
                ELEGÍ TU PLAN (TODOS INCLUYEN 7 DÍAS GRATIS):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {(['monthly', 'semiannual', 'annual'] as PlanType[]).map((pKey) => {
                  const p = PLANS[pKey];
                  const isSel = selectedPlan === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setSelectedPlan(pKey)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: isSel ? '2px solid #d4ef7b' : '1px solid #325a4d',
                        background: isSel ? '#19493f' : '#0e2b26',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 13 }}>{p.name}</strong>
                        {p.badge && (
                          <span style={{ fontSize: 9, background: '#d4ef7b', color: '#143c35', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                            {pKey === 'annual' ? '20% OFF' : '10% OFF'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, margin: '6px 0 2px' }}>
                        US${p.totalCharge}{' '}
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#a6beae' }}>
                          {pKey === 'annual' ? '/año' : pKey === 'semiannual' ? '/6 meses' : '/mes'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#88a892' }}>
                        {p.savingsAmount > 0
                          ? `Eq. US$${p.monthlyEquivalent}/mes (ahorro US$${p.savingsAmount})`
                          : 'Cobro mensual estándar'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sandbox && enabled && (
            <p style={{ color: '#fed7aa', fontSize: 11, marginTop: 8 }}>
              ⚙️ Entorno de prueba (Sandbox): usá exclusivamente tarjetas de prueba provistas por Paddle.
            </p>
          )}

          {!enabled && (
            <p style={{ color: '#d8c282', fontSize: 11, marginTop: 8 }}>
              ⚠️ Los cobros automáticos están deshabilitados en esta versión (`BILLING_ENABLED=false`). Tu tarjeta no se solicitará ni se cobrará dinero real hasta su habilitación formal.
            </p>
          )}

          {!subscribed && (
            <label className="check-label" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span style={{ color: '#d3e2d6' }}>
                Autorizo la renovación por <strong>US${plan.totalCharge}</strong> ({plan.billingPeriodLabel}) luego de finalizar los 7 días de prueba. Puedo cancelar desde el panel en cualquier momento antes de finalizar los 7 días para evitar el primer cobro.
              </span>
            </label>
          )}
        </div>

        <div>
          <button
            className="button light"
            disabled={busy || !enabled || (!subscribed && (!consent || !ready))}
            onClick={action}
            style={{ minWidth: 200 }}
          >
            {busy
              ? 'Abriendo…'
              : subscribed
              ? 'Gestionar suscripción / Cancelar'
              : `Activar prueba 7 días (US$${plan.totalCharge}) →`}
          </button>
        </div>
      </section>

      {message && (
        <p className="notice error" role="status" style={{ marginTop: 12 }}>
          {message}
        </p>
      )}

      {enabled && token && (
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (window.Paddle) {
              if (sandbox) window.Paddle.Environment.set('sandbox');
              window.Paddle.Initialize({ token });
              setReady(true);
            }
          }}
          onError={() => setMessage('No se pudo cargar el checkout. Intentá más tarde.')}
        />
      )}
    </>
  );
}
