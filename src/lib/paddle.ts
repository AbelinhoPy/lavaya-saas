import 'server-only';
export async function paddle(path: string, method = 'GET', body?: unknown) {
 if (process.env.BILLING_ENABLED !== 'true' || !process.env.PADDLE_API_KEY || !process.env.PADDLE_PRICE_ID || !process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) throw new Error('Pagos todavía no habilitados. Tu tarjeta no se solicitó ni se cobró.');
 const base = process.env.PADDLE_ENVIRONMENT === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
 const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: AbortSignal.timeout(15000) });
 if (!response.ok) throw new Error('No pudimos verificar el proveedor de pagos. Intentá más tarde.');
 return (await response.json()).data;
}
