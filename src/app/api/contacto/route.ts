import { NextRequest, NextResponse } from 'next/server';
import { sendContactInquiryEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
    }

    // Honeypot anti-spam check
    if (body.website) {
      return NextResponse.json({ success: true, message: 'Mensaje recibido.' });
    }

    const nombre = typeof body.nombre === 'string' ? body.nombre.trim().slice(0, 100) : '';
    const contacto = typeof body.contacto === 'string' ? body.contacto.trim().slice(0, 120) : '';
    const tipo = typeof body.tipo === 'string' && ['consulta', 'sugerencia', 'demo'].includes(body.tipo)
      ? body.tipo
      : 'consulta';
    const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim() : '';

    if (!mensaje || mensaje.length < 3) {
      return NextResponse.json(
        { error: 'Por favor, escribí un mensaje de al menos 3 caracteres.' },
        { status: 400 }
      );
    }

    if (mensaje.length > 3000) {
      return NextResponse.json(
        { error: 'El mensaje es demasiado largo (máximo 3000 caracteres).' },
        { status: 400 }
      );
    }

    if (!contacto && !nombre) {
      return NextResponse.json(
        { error: 'Por favor, dejanos tu nombre, correo o WhatsApp para poder responderte.' },
        { status: 400 }
      );
    }

    const emailResult = await sendContactInquiryEmail({
      nombre,
      contacto,
      tipo,
      mensaje,
    });

    if (!emailResult.success) {
      console.error('[API Contacto Error]', emailResult.error);
      return NextResponse.json(
        { error: 'No pudimos enviar tu mensaje en este momento. Por favor escribinos directamente a abelnunez997@gmail.com' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '¡Muchas gracias! Tu mensaje fue enviado directamente a Abel. Te responderemos a la brevedad.',
    });
  } catch (err: any) {
    console.error('[API Contacto Exception]', err);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu solicitud.' },
      { status: 500 }
    );
  }
}
