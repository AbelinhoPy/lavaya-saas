'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Car, Bike, Clock, CheckCircle2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/brand';

interface PublicStatusData {
  placa: string;
  tipo: 'auto' | 'moto';
  marca?: string;
  servicio: string;
  estado: 'espera' | 'lavando' | 'listo' | 'entregado';
  lavadero: string;
  tiempos: {
    recibido: string;
    inicioLavado?: string;
    listo?: string;
    entregado?: string;
  };
}

export default function EstadoPorTokenPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [data, setData] = useState<PublicStatusData | null>(null);
  const [isDemo, setIsDemo] = useState(() => Boolean(typeof token === 'string' && token.startsWith('tk_demo_')));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Código de seguimiento inválido.');
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/estado/${token}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'No pudimos consultar el estado.');
        }
        setData(json.data);
        setIsDemo(Boolean(json.isDemo));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al consultar el seguimiento.');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [token]);

  const steps = [
    { key: 'espera', label: 'En espera', desc: 'Pronto iniciaremos el lavado en pista' },
    { key: 'lavando', label: 'Lavando', desc: 'Tu vehículo está siendo lavado y acondicionado' },
    { key: 'listo', label: 'Listo', desc: '¡Tu vehículo está listo para retirar!' },
    { key: 'entregado', label: 'Entregado', desc: 'Vehículo entregado. ¡Gracias por tu visita!' },
  ];

  const getStepIndex = (state: string) => {
    switch (state) {
      case 'espera':
        return 0;
      case 'lavando':
        return 1;
      case 'listo':
        return 2;
      case 'entregado':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = data ? getStepIndex(data.estado) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', background: 'white' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand />
          <span className="pill" style={{ fontSize: 10 }}>
            CONSULTA CLIENTE
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '36px 20px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {isDemo && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>🧪</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 13, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  VISTA DE DEMOSTRACIÓN (EJEMPLO FICTICIO)
                </strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  DEMO
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
                Esta es una vista previa de ejemplo que ilustra lo que ve tu cliente en su celular al consultar el enlace público de seguimiento.
              </p>
              <p
                style={{
                  margin: '8px 0 0',
                  padding: '8px 10px',
                  background: '#fef3c7',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#92400e',
                  fontWeight: 600,
                }}
              >
                ⚠️ Importante: Esta vista de prueba no consulta ni escribe datos reales en la base de datos, y no refleja los cambios locales que realices en el tablero de demostración.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            Consultando el estado de tu vehículo en pista...
          </div>
        )}

        {error && (
          <div style={{ background: '#fff1e9', border: '1px solid #efcdbb', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <AlertCircle size={36} color="#c2410c" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: 20, color: '#9a3412', marginBottom: 8 }}>Vehículo no encontrado</h2>
            <p style={{ color: '#7c2d12', fontSize: 13, marginBottom: 20 }}>{error}</p>
            <Link className="button small" href="/">
              Volver al inicio
            </Link>
          </div>
        )}

        {data && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: '32px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf1ea', paddingBottom: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 36 }}>{data.tipo === 'moto' ? '🏍️' : '🚗'}</span>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block' }}>
                    {data.lavadero}
                  </span>
                  <h1 style={{ fontSize: 28, margin: '2px 0 0', letterSpacing: '0.5px' }}>{data.placa}</h1>
                  {data.marca && <small style={{ color: 'var(--muted)', fontSize: 13 }}>{data.marca}</small>}
                </div>
              </div>

              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    data.estado === 'listo'
                      ? '#d4ef7b'
                      : data.estado === 'lavando'
                      ? '#dbeafe'
                      : data.estado === 'entregado'
                      ? '#e2f0d9'
                      : '#fef3c7',
                  color:
                    data.estado === 'listo'
                      ? '#143c35'
                      : data.estado === 'lavando'
                      ? '#1e40af'
                      : data.estado === 'entregado'
                      ? '#166534'
                      : '#92400e',
                }}
              >
                {data.estado === 'listo'
                  ? '✨ LISTO PARA RETIRAR'
                  : data.estado === 'lavando'
                  ? '🧽 EN LAVADO'
                  : data.estado === 'entregado'
                  ? '✓ ENTREGADO'
                  : '⏳ EN ESPERA'}
              </span>
            </div>

            {/* Service contracted */}
            <div style={{ background: '#f8faf6', padding: '12px 16px', borderRadius: 8, marginBottom: 28 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Servicio en proceso
              </span>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2, color: 'var(--ink)' }}>{data.servicio}</div>
            </div>

            {/* Step progress timeline */}
            <div style={{ position: 'relative', paddingLeft: 32, display: 'grid', gap: 24, margin: '20px 0' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 11,
                  top: 12,
                  bottom: 12,
                  width: 2,
                  background: '#e0e7de',
                }}
              />

              {steps.map((st, i) => {
                const isPassed = i <= currentStep;
                const isCurrent = i === currentStep;

                return (
                  <div key={st.key} style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: -32,
                        top: 2,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isPassed ? '#245b4d' : '#f0f3ee',
                        color: isPassed ? 'white' : '#889988',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        border: isCurrent ? '3px solid #d4ef7b' : 'none',
                      }}
                    >
                      {isPassed ? '✓' : i + 1}
                    </div>

                    <div>
                      <strong style={{ fontSize: 15, color: isPassed ? 'var(--ink)' : 'var(--muted)' }}>
                        {st.label}
                      </strong>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: isPassed ? 'var(--muted)' : '#a0b0a2' }}>
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ready Callout */}
            {data.estado === 'listo' && (
              <div
                style={{
                  background: '#f2f9eb',
                  border: '2px solid #b8e096',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'center',
                  marginTop: 24,
                }}
              >
                <Sparkles size={24} color="#276b42" style={{ margin: '0 auto 6px' }} />
                <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1b4d2e' }}>¡Tu vehículo ya está terminado!</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#3f684e' }}>
                  Podés pasar por {data.lavadero} a retirar las llaves cuando gustes.
                </p>
              </div>
            )}

            <div style={{ borderTop: '1px solid #edf1ea', marginTop: 28, paddingTop: 16, textAlign: 'center' }}>
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', lineHeight: 1.5 }}>
                {isDemo
                  ? 'Esta es una vista previa de demostración con fines ilustrativos. En una cuenta activa, el enlace se genera automáticamente para cada vehículo y muestra el avance en tiempo real sin requerir inicio de sesión del cliente.'
                  : 'Esta es una consulta pública segura de seguimiento. No contiene importes, números de teléfono ni datos de facturación.'}
              </small>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
