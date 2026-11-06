import Link from 'next/link';
import { Instagram } from 'lucide-react';

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="LavaYA!, inicio">
      <span className="brand-symbol">≈</span>LavaYA<span className="brand-dot">!</span>
    </Link>
  );
}

export function Nav() {
  return (
    <header className="nav wrap">
      <Brand />
      <nav aria-label="Principal">
        <a href="/#funciones">Cómo funciona</a>
        <a href="/#precio">Planes</a>
        <a href="/#contacto">Contacto</a>
        <Link href="/demo">Demo</Link>
        <Link href="/ingresar">Ingresar</Link>
        <Link className="button small" href="/registro">
          Empezar <span>↗</span>
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer wrap">
      <div>
        <Brand />
        <p style={{ marginTop: 8 }}>Menos planillas y mensajes perdidos. Todo el lavadero en orden.</p>
        <small style={{ color: 'var(--muted)', display: 'block', marginTop: 4 }}>
          Operación en Guaraníes (Gs.) para lavaderos de Paraguay · SaaS por Abel
        </small>
        <div style={{ marginTop: 12 }}>
          <a
            href="https://www.instagram.com/lavaya_app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#be185d',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              background: '#fdf2f8',
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid #fbcfe8',
            }}
          >
            <Instagram size={15} /> @lavaya_app
          </a>
        </div>
      </div>
      <div>
        <Link href="/demo">Demo interactiva</Link>
        <Link href="/estado/consulta">Seguimiento de cliente</Link>
        <a href="/#contacto">Contacto y Sugerencias</a>
        <a
          href="https://www.instagram.com/lavaya_app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Instagram size={14} /> Instagram
        </a>
        <Link href="/terminos">Términos del servicio</Link>
        <Link href="/privacidad">Privacidad</Link>
      </div>
      <p>© {new Date().getFullYear()} LavaYA! · Todos los derechos reservados.</p>
    </footer>
  );
}
