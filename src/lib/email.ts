import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = process.env.EMAIL_FROM || 'LavaYA! <onboarding@resend.dev>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn(`[LavaYA! Email] RESEND_API_KEY no está configurada. Simulación de envío a ${to}: "${subject}"`);
    return { success: true, id: 'simulated-no-api-key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
    });

    if (error) {
      console.error('[LavaYA! Email Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[LavaYA! Email Exception]', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

// ============================================================================
// Plantillas HTML con diseño profesional LavaYA!
// ============================================================================

function baseEmailTemplate({ title, content, buttonText, buttonUrl }: { title: string; content: string; buttonText: string; buttonUrl: string }): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .logo span { color: #a7f3d0; }
    .tagline { color: #d1fae5; font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .body { padding: 32px 28px; }
    h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
    .fallback { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="logo">Lava<span>YA!</span></h1>
      <p class="tagline">Gestión Operativa para Lavaderos</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${content}
      <div class="btn-container">
        <a href="${buttonUrl}" class="btn" target="_blank">${buttonText}</a>
      </div>
      <p class="fallback">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${buttonUrl}" style="color: #059669;">${buttonUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">LavaYA! — Simplificando la operación diaria de tu lavadero.</p>
      <p style="margin: 4px 0 0;">Si no solicitaste este correo, puedes ignorarlo de forma segura.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Correo 1: Confirmación y verificación de cuenta
 */
export async function sendVerificationEmail({ email, name, url }: { email: string; name: string; url: string }) {
  const content = `
    <p>¡Hola <strong>${name || 'Colega'}</strong>!</p>
    <p>Gracias por unirte a <strong>LavaYA!</strong>. Para activar la cuenta de tu lavadero y comenzar a registrar vehículos y cobros, confirma tu dirección de correo electrónico haciendo clic en el botón a continuación:</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Activa tu cuenta en LavaYA!',
    html: baseEmailTemplate({
      title: 'Confirma tu correo electrónico',
      content,
      buttonText: 'Activar mi cuenta',
      buttonUrl: url,
    }),
  });
}

/**
 * Correo 2: Restablecimiento de contraseña olvidada
 */
export async function sendPasswordResetEmail({ email, name, url }: { email: string; name: string; url: string }) {
  const content = `
    <p>Hola <strong>${name || 'Usuario'}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>LavaYA!</strong>.</p>
    <p>Haz clic en el siguiente botón para elegir una nueva contraseña. Este enlace es válido por 1 hora por razones de seguridad:</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Restablece tu contraseña de LavaYA!',
    html: baseEmailTemplate({
      title: 'Restablecer contraseña',
      content,
      buttonText: 'Crear nueva contraseña',
      buttonUrl: url,
    }),
  });
}

/**
 * Correo 3: Consultas, sugerencias o mensajes recibidos desde la web
 */
export async function sendContactInquiryEmail({
  nombre,
  contacto,
  tipo,
  mensaje,
}: {
  nombre: string;
  contacto: string;
  tipo: string;
  mensaje: string;
}) {
  const content = `
    <p>Has recibido un nuevo mensaje enviado a través de la web de <strong>LavaYA!</strong>:</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 14px;"><strong>Remitente:</strong> ${nombre || 'No indicado'}</p>
      <p style="margin: 0 0 10px; font-size: 14px;"><strong>Contacto (Email / Teléfono):</strong> <a href="${contacto.includes('@') ? 'mailto:' + contacto : 'tel:' + contacto}" style="color: #059669; font-weight: 600;">${contacto || 'No indicado'}</a></p>
      <p style="margin: 0 0 10px; font-size: 14px;"><strong>Tipo de mensaje:</strong> <span style="background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">${tipo.toUpperCase()}</span></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 14px 0;" />
      <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Contenido del mensaje:</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #0f172a; white-space: pre-wrap; font-style: italic;">"${mensaje}"</p>
    </div>
    <p style="font-size: 13px; color: #64748b;">Podés responderle directamente contactándolo por el correo o teléfono que dejó registrado arriba.</p>
  `;

  const subjectType = tipo === 'sugerencia' ? 'Sugerencia' : tipo === 'demo' ? 'Solicitud Demo' : 'Consulta';
  const senderIdentifier = nombre || contacto || 'Nuevo visitante';

  const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'abelnunez997@gmail.com';

  return sendEmail({
    to: recipient,
    subject: `LavaYA! [${subjectType}] de ${senderIdentifier}`,
    html: baseEmailTemplate({
      title: `LavaYA! · ${subjectType}`,
      content,
      buttonText: 'Ir a LavaYA! Panel',
      buttonUrl: 'https://lavaya-orcin.vercel.app/panel',
    }),
  });
}
