import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavaya-toman13.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LavaYA! — Sistema para Lavaderos de Autos y Motos | Software de Gestión',
    template: '%s | LavaYA!',
  },
  description:
    'El software y sistema para lavaderos de autos y motos más rápido y fácil de usar. Control de vehículos en pista, arqueo de caja diaria en Guaraníes, cobros por transferencia y seguimiento online para clientes.',
  keywords: [
    'sistema para lavaderos',
    'software para lavadero de autos',
    'programa para lavadero de autos',
    'sistema para lavadero de autos y motos',
    'control de lavadero',
    'gestion de lavadero paraguay',
    'sistema para car wash',
    'software lavadero paraguay',
    'administracion de lavadero de autos',
    'caja diaria lavadero',
  ],
  authors: [{ name: 'LavaYA!' }],
  creator: 'LavaYA!',
  publisher: 'LavaYA!',
  applicationName: 'LavaYA!',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LavaYA! — Sistema y Software de Gestión para Lavaderos de Autos',
    description:
      'Control total de vehículos, pista de lavado en tiempo real, arqueo de caja en efectivo y transferencias, y seguimiento para tus clientes.',
    url: siteUrl,
    siteName: 'LavaYA!',
    locale: 'es_PY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LavaYA! — Sistema para Lavaderos de Autos y Motos',
    description:
      'Gestiona tu lavadero como un profesional: pista Kanban, caja diaria en Guaraníes y seguimiento en vivo.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'wl_FSLn9VfpvoOxd-jENh_zx3BRgmByA4SX3bKpyWHU',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LavaYA!',
  operatingSystem: 'All (Web, Mobile, Desktop)',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '20.00',
    priceCurrency: 'USD',
  },
  description:
    'Software SaaS de gestión operativa, pista Kanban y control de caja diaria para lavaderos de autos y motos.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '48',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7657869988993438"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
