import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavaya-toman13.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/panel/',
          '/api/',
          '/auth/',
          '/estado/*', // Tokens privados de vehículos de clientes
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/panel/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
