'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { Search, ArrowLeft } from 'lucide-react';

export default function ConsultaEstadoPage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.trim();
    if (!clean) {
      setError('Ingresá el código de seguimiento provisto por el lavadero.');
      return;
    }
    // Clean code or full token
    const token = clean.startsWith('tk_') ? clean : `tk_${clean}`;
    router.push(`/estado/${token}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', background: 'white' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand />
          <Link href="/" style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Volver
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '60px 20px', maxWidth: 540, margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: '36px 28px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>Consultar estado de lavado</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Ingresá el código de seguimiento que te enviaron por WhatsApp o recibiste al dejar tu vehículo en el lavadero.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
              Código de seguimiento
              <input
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setError('');
                }}
                placeholder="Ej: tk_a1b2c3d4e5f6 o tu código"
                required
                style={{
                  padding: 12,
                  border: '1px solid #ccd8c8',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              />
            </label>

            {error && (
              <p className="notice error" style={{ margin: 0 }}>
                {error}
              </p>
            )}

            <button className="button" style={{ marginTop: 8 }}>
              <Search size={16} /> Consultar estado en pista
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            El sistema de seguimiento muestra únicamente si tu vehículo está en espera, en proceso de lavado o listo para retirar.
          </p>
        </div>
      </main>
    </div>
  );
}
