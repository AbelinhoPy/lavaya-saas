const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

function baseEmailTemplate({ title, content, buttonText, buttonUrl }) {
  return `<!DOCTYPE html>
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
</html>`;
}

const content = `
  <p>¡Hola <strong>Abel</strong>!</p>
  <p>Gracias por unirte a <strong>LavaYA!</strong>. Para activar la cuenta de tu lavadero y comenzar a registrar vehículos y cobros en Guaraníes, confirma tu dirección de correo electrónico haciendo clic en el botón a continuación:</p>
`;

async function main() {
  const res = await resend.emails.send({
    from: 'LavaYA! <onboarding@resend.dev>',
    to: 'panky.mne@gmail.com',
    subject: 'Activa tu cuenta en LavaYA! (Ejemplo Real)',
    html: baseEmailTemplate({
      title: 'Confirma tu correo electrónico',
      content,
      buttonText: 'Activar mi cuenta',
      buttonUrl: 'https://lavaya-toman13.vercel.app/api/auth/verify-email?token=ejemplo-token-demostracion',
    })
  });
  console.log('ENVIADO_CON_EXITO:', res.data ? res.data.id : res.error);
}

main();
