'use client';
import { useState } from 'react';
import { Tag, Sparkles, Wrench, ShieldCheck, ChevronRight, MessageCircle } from 'lucide-react';

interface SponsoredAdProps {
  lavaderoNombre?: string;
  isDemo?: boolean;
}

const SAMPLE_ADS = [
  {
    id: 'taller-express',
    categoria: 'Mecánica & Mantenimiento',
    titulo: 'LubriExpress & Taller Mecánico',
    icono: '🛢️',
    descripcion: '15% de descuento en cambio de aceite, filtro y revisión de frenos presentando tu lavado de hoy.',
    cta: 'Reclamar descuento',
    contacto: 'https://wa.me/?text=Hola%2C%20vi%20el%20descuento%20en%20el%20seguimiento%20de%20LavaYA!%20y%20quiero%20consultar%20por%20cambio%20de%20aceite',
    badge: 'Beneficio exclusivo',
  },
  {
    id: 'gomeria-central',
    categoria: 'Neumáticos & Suspensión',
    titulo: 'Gomería & Alineación 3D',
    icono: '🛞',
    descripcion: 'Alineación computarizada y calibración de neumáticos con 20% OFF para clientes del lavadero.',
    cta: 'Pedir turno por WhatsApp',
    contacto: 'https://wa.me/?text=Hola%2C%20vi%20el%20anuncio%20en%20LavaYA!%20y%20quiero%20agendar%20alineacion',
    badge: 'Descuento local',
  },
  {
    id: 'baterias-delivery',
    categoria: 'Baterías & Electricidad',
    titulo: 'Baterías Express a Domicilio',
    icono: '⚡',
    descripcion: '¿Tu batería falló? Entrega e instalación sin cargo en 30 minutos con garantía oficial de 1 año.',
    cta: 'Consultar precios',
    contacto: 'https://wa.me/?text=Hola%2C%20vi%20su%20publicidad%20en%20LavaYA!%20para%20baterias',
    badge: 'Servicio rápido',
  },
];

export function SponsoredAd({ lavaderoNombre = 'este lavadero', isDemo = false }: SponsoredAdProps) {
  const [adIndex, setAdIndex] = useState(0);
  const ad = SAMPLE_ADS[adIndex];

  return (
    <div
      style={{
        marginTop: 28,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #fdfbf7 0%, #f4f8f3 100%)',
        border: '1px solid #dbe7d7',
        padding: '20px 20px 16px',
        position: 'relative',
        boxShadow: '0 4px 16px rgba(20, 60, 53, 0.04)',
      }}
    >
      {/* Encabezado del bloque publicitario */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          borderBottom: '1px solid #e5ede3',
          paddingBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={13} color="#245b4d" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#245b4d',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            Beneficio para tu vehículo mientras esperás
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            background: '#e9f3e6',
            color: '#166534',
            padding: '2px 8px',
            borderRadius: 12,
            border: '1px solid #cce3c6',
          }}
        >
          ESPACIO PATROCINADO
        </span>
      </div>

      {/* Contenido del Anuncio */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 28,
            width: 52,
            height: 52,
            borderRadius: 12,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e0eae0',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          {ad.icono}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: '#68826d', fontWeight: 600, textTransform: 'uppercase' }}>
              {ad.categoria}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                background: '#fef3c7',
                color: '#92400e',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {ad.badge}
            </span>
          </div>

          <h4 style={{ margin: '0 0 4px', fontSize: 16, color: '#13352c', fontWeight: 700 }}>
            {ad.titulo}
          </h4>

          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#3d5244', lineHeight: 1.5 }}>
            {ad.descripcion}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={ad.contacto}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#25D366',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
              }}
            >
              <MessageCircle size={14} />
              {ad.cta}
            </a>

            {/* Selector de anuncios rotativos */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {SAMPLE_ADS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setAdIndex(idx)}
                  aria-label={`Ver anuncio ${idx + 1}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: idx === adIndex ? '#245b4d' : '#cfdcd0',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Llamada comercial para vender el espacio publicitario a talleres/gomerías locales */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px dashed #d5e2d1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 11, color: '#526b58' }}>
          ¿Tenés un taller, gomería o negocio automotor?
        </span>
        <a
          href="https://wa.me/?text=Hola%2C%20quiero%20publicitar%20mi%20negocio%20en%20los%20enlaces%20de%20seguimiento%20de%20LavaYA!"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: '#1e5445',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          Publicitá aquí tu negocio <ChevronRight size={13} />
        </a>
      </div>
    </div>
  );
}
