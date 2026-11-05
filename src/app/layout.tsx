import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LavaYA! — Tu lavadero de autos y motos, bajo control.',
    template: '%s | LavaYA!',
  },
  description:
    'SaaS de gestión operativa y caja para lavaderos de autos y motos en Paraguay. Pista, cobros en Guaraníes, gastos del día y seguimiento para tus clientes.',
  openGraph: {
    title: 'LavaYA! — El orden que tu lavadero necesita',
    description:
      'Control de vehículos en pista, arqueo de caja con efectivo y transferencias, catálogo de tarifas y seguimiento para clientes.',
    url: siteUrl,
    siteName: 'LavaYA!',
    locale: 'es_PY',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
