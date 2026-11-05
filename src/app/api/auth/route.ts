import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, originCheck, fail, boundedJSON } from '@/lib/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    if (!authConfigured()) {
      throw new Error('Servicio de cuentas todavía no configurado. Podés explorar la demo sin registrarte.');
    }

    const { mode, email: value, password, business, consent, token } = await boundedJSON(req);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

    if (mode === 'logout') {
      const res = await auth.api.signOut({ headers: req.headers, asResponse: true });
      return res;
    }

    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new Error('Completá un correo válido.');
    }

    if (mode === 'recover') {
      try {
        await auth.api.requestPasswordReset({
          body: {
            email,
            redirectTo: `${origin}/restablecer`,
          },
        });
      } catch (e) {
        // Log internally, never expose account existence to client
        console.warn('[Password Reset]', e);
      }
      return NextResponse.json({
        message: 'Si el correo está registrado, recibirás un enlace para cambiar la contraseña.',
      });
    }

    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      throw new Error('Completá una contraseña de entre 10 y 128 caracteres.');
    }

    if (mode === 'register') {
      if (consent !== true) {
        throw new Error('Completá la aceptación de las condiciones para crear la cuenta.');
      }
      if (typeof business !== 'string' || business.trim().length < 2 || business.length > 100) {
        throw new Error('Completá el nombre del lavadero (2–100 caracteres).');
      }

      const res = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: business.trim(),
        },
        asResponse: true,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              errorData.message ||
              'No pudimos crear la cuenta. Revisá los datos o intentá ingresar si ya tenés una.',
          },
          { status: 400 }
        );
      }

      // Automatically initialize business and default services in Neon
      const responseData = await res.clone().json().catch(() => null);
      const userId = responseData?.user?.id;
      if (userId) {
        try {
          const bRows = await query(
            'INSERT INTO public.businesses (owner_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
            [userId, business.trim()]
          );
          const bizId = bRows[0]?.id;
          if (bizId) {
            await query('SELECT public.seed_default_services($1)', [bizId]);
            await query(
              'INSERT INTO public.business_members (business_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
              [bizId, userId, 'owner']
            );
          }
        } catch (dbErr) {
          console.error('[Error Initializing Business]', dbErr);
        }
      }

      return res;
    }

    if (mode === 'reset') {
      if (!token || typeof token !== 'string') {
        throw new Error('Iniciá sesión desde el enlace de recuperación.');
      }
      const res = await auth.api.resetPassword({
        body: {
          newPassword: password,
          token,
        },
        asResponse: true,
      });
      if (!res.ok) {
        throw new Error('No pudimos completar la operación. El enlace puede haber vencido.');
      }
      return NextResponse.json({
        message: 'Contraseña actualizada. Ya podés abrir tu panel.',
        redirect: '/panel',
      });
    }

    if (mode !== 'login') {
      throw new Error('Datos inválidos.');
    }

    const loginRes = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!loginRes.ok) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos, o cuenta aún sin confirmar.' },
        { status: 401 }
      );
    }

    return loginRes;
  } catch (e) {
    return fail(e);
  }
}
