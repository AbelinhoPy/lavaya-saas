'use client';
import { useState } from 'react';
import { Send, CheckCircle2, Instagram, MessageSquare, Sparkles, HelpCircle } from 'lucide-react';

export default function ContactForm() {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [tipo, setTipo] = useState<'consulta' | 'sugerencia' | 'demo'>('consulta');
  const [mensaje, setMensaje] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor escribí tu consulta o sugerencia.' });
      return;
    }
    if (!contacto.trim() && !nombre.trim()) {
      setStatusMessage({ type: 'error', text: 'Dejanos al menos tu nombre, WhatsApp o correo para poder responderte.' });
      return;
    }

    setBusy(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          tipo,
          mensaje: mensaje.trim(),
          website: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No pudimos enviar tu mensaje.');
      }

      setStatusMessage({
        type: 'success',
        text: '¡Tu mensaje fue enviado con éxito a Abel! Te responderemos muy pronto.',
      });
      setMensaje('');
      setNombre('');
      setContacto('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al enviar el mensaje. Podés escribir directamente a abelnunez997@gmail.com',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32,
        alignItems: 'start',
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left Column: Context & Instagram */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          <span /> CONTACTO Y COMUNIDAD
        </div>
        <h3 style={{ fontSize: 26, margin: '0 0 12px', color: '#143c35', lineHeight: 1.25 }}>
          ¿Dudas, sugerencias o querés probar el sistema?
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Dejanos tu mensaje y te responderemos directo a tu correo o WhatsApp. También podés seguirnos y enviarnos un DM en Instagram para conocer novedades del sistema.
        </p>

        {/* Instagram Card Button */}
        <a
          href="https://www.instagram.com/lavaya_app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 50%, #fef3c7 100%)',
            border: '1px solid #fecdd3',
            color: '#9f1239',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            marginBottom: 20,
          }}
          className="instagram-banner"
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Instagram size={22} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Seguinos en Instagram</div>
            <div style={{ fontSize: 12, color: '#e11d48', fontWeight: 600 }}>@lavaya_app ↗</div>
          </div>
        </a>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          <div><strong>Correo corporativo:</strong> contacto@lavaya.app</div>
          <div style={{ marginTop: 4 }}><strong>Atención directa:</strong> abelnunez997@gmail.com</div>
          <div style={{ marginTop: 4 }}><strong>Ubicación:</strong> Ciudad del Este, Paraguay</div>
        </div>
      </div>

      {/* Right Column: Contact Form */}
      <div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Honeypot field (hidden from real users) */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#143c35', marginBottom: 6 }}>
              Tipo de mensaje:
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'consulta', label: 'Consulta', icon: HelpCircle },
                { id: 'sugerencia', label: 'Sugerencia', icon: Sparkles },
                { id: 'demo', label: 'Quiero una demo', icon: MessageSquare },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTipo(item.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: tipo === item.id ? '2px solid #143c35' : '1px solid #d1d5db',
                    background: tipo === item.id ? '#143c35' : '#f8fafc',
                    color: tipo === item.id ? '#fff' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <item.icon size={13} /> {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#143c35', marginBottom: 4 }}>
                Tu nombre / Lavadero:
              </label>
              <input
                type="text"
                placeholder="Ej: Marcelo (Lavadero San Juan)"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#143c35', marginBottom: 4 }}>
                WhatsApp o Correo:
              </label>
              <input
                type="text"
                placeholder="0981... o tu correo"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#143c35', marginBottom: 4 }}>
              ¿En qué podemos ayudarte? / Tu sugerencia:
            </label>
            <textarea
              required
              rows={4}
              placeholder="Escribí acá tu duda, consulta sobre precios, o ideas que te gustaría ver en el sistema..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
                border: statusMessage.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              }}
            >
              {statusMessage.type === 'success' && <CheckCircle2 size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="button"
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 20px',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Enviando mensaje...' : <>Enviar consulta o sugerencia <Send size={15} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
