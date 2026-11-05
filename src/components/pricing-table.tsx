'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowUpRight } from 'lucide-react';
import { PlanType, PLANS } from '@/lib/plans';

export default function PricingTable() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

  const p = PLANS[selectedPlan];

  return (
    <div className="pricing-container" style={{ width: '100%', margin: '40px auto 0' }}>
      {/* Plan Period Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedPlan('monthly')}
          style={{
            padding: '10px 20px',
            borderRadius: 30,
            border: selectedPlan === 'monthly' ? '2px solid #143c35' : '1px solid #ccd8c8',
            background: selectedPlan === 'monthly' ? '#143c35' : '#fff',
            color: selectedPlan === 'monthly' ? '#fff' : '#143c35',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Mensual (US$20/mes)
        </button>

        <button
          type="button"
          onClick={() => setSelectedPlan('semiannual')}
          style={{
            padding: '10px 20px',
            borderRadius: 30,
            border: selectedPlan === 'semiannual' ? '2px solid #143c35' : '1px solid #ccd8c8',
            background: selectedPlan === 'semiannual' ? '#143c35' : '#fff',
            color: selectedPlan === 'semiannual' ? '#fff' : '#143c35',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Semestral (US$108 cada 6 meses)
          <span style={{ fontSize: 10, background: '#d4ef7b', color: '#143c35', padding: '2px 8px', borderRadius: 12 }}>
            Ahorro 10%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPlan('annual')}
          style={{
            padding: '10px 20px',
            borderRadius: 30,
            border: selectedPlan === 'annual' ? '2px solid #143c35' : '1px solid #ccd8c8',
            background: selectedPlan === 'annual' ? '#143c35' : '#fff',
            color: selectedPlan === 'annual' ? '#fff' : '#143c35',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Anual (US$192 cada 12 meses)
          <span style={{ fontSize: 10, background: '#d4ef7b', color: '#143c35', padding: '2px 8px', borderRadius: 12 }}>
            Mayor ahorro 20%
          </span>
        </button>
      </div>

      {/* 3 Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {(['monthly', 'semiannual', 'annual'] as PlanType[]).map((planKey) => {
          const item = PLANS[planKey];
          const isSelected = selectedPlan === planKey;

          return (
            <div
              key={planKey}
              onClick={() => setSelectedPlan(planKey)}
              style={{
                background: '#fff',
                border: isSelected ? '2px solid #285e4c' : '1px solid var(--line)',
                borderRadius: 16,
                padding: '32px 28px',
                position: 'relative',
                boxShadow: isSelected ? '0 16px 36px rgba(20, 60, 53, 0.12)' : '0 4px 14px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {item.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    background: '#143c35',
                    color: '#d4ef7b',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    padding: '4px 12px',
                    borderRadius: 20,
                  }}
                >
                  {item.badge.toUpperCase()}
                </div>
              )}

              <div>
                <span className="plan-label" style={{ color: isSelected ? '#1b4d2e' : 'var(--muted)' }}>
                  {item.name.toUpperCase()}
                </span>

                <div className="price" style={{ margin: '14px 0 6px' }}>
                  US${item.totalCharge}
                  <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>
                    {planKey === 'annual' ? '/año' : planKey === 'semiannual' ? '/6 meses' : '/mes'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#38634e', fontWeight: 600, minHeight: 20, marginBottom: 16 }}>
                  {item.savingsAmount > 0 ? (
                    <>
                      Equivale a <strong>US${item.monthlyEquivalent}/mes</strong> · Ahorro de US${item.savingsAmount}
                    </>
                  ) : (
                    'Facturación mensual regular'
                  )}
                </div>

                <p style={{ fontSize: 12, color: 'var(--muted)', borderTop: '1px solid #edf1ea', paddingTop: 14 }}>
                  Prueba de <strong>7 días gratis con tarjeta</strong> antes del primer cobro.
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0', display: 'grid', gap: 10, fontSize: 13 }}>
                  {[
                    'Tablero completo de pista y vehículos',
                    'Caja del día con desglose de cobros y gastos',
                    'Diferenciación de efectivo, transferencias y pendientes',
                    'Catálogo de servicios y precios en Guaraníes',
                    'Enlace de seguimiento por token para clientes',
                    'Soporte directo desde celular o computadora',
                  ].map((feature, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Check size={16} color="#2e6f47" style={{ flexShrink: 0 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Link
                  className="button"
                  href={`/registro?plan=${planKey}`}
                  style={{
                    width: '100%',
                    background: isSelected ? '#143c35' : '#eef3eb',
                    color: isSelected ? '#fff' : '#143c35',
                  }}
                >
                  Probar 7 días gratis <ArrowUpRight size={16} />
                </Link>

                <small
                  style={{
                    display: 'block',
                    fontSize: 10,
                    lineHeight: 1.5,
                    color: 'var(--muted)',
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  Cobro de US${item.totalCharge} al finalizar los 7 días ({item.billingPeriodLabel}). Cancelá antes de terminar la prueba para evitar cargos.
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
