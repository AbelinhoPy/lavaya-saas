export function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100').replace(/\/$/, '');
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const publicRoutes = ['', '/demo', '/terminos', '/privacidad', '/estado/consulta'];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    (p) => `  <url>
    <loc>${escape(base + p)}</loc>
    <changefreq>${p === '' ? 'daily' : 'monthly'}</changefreq>
    <priority>${p === '' ? '1.0' : '0.7'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
