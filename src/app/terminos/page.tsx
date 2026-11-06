import { Nav, Footer } from '@/components/brand';

export const metadata = {
  title: 'Términos y Condiciones del Servicio · LavaYA!',
  description: 'Términos de servicio, períodos de prueba, renovación, cancelación y responsabilidades de LavaYA!.',
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="legal wrap">
        <div className="eyebrow">CONDICIONES DEL SERVICIO</div>
        <h1>Términos del Servicio</h1>
        <div className="notice">
          Documento regulatorio del servicio SaaS LavaYA!. Cobros, suscripciones y facturación procesados por Paddle Payments Ltd. como Comerciante de Registro (Merchant of Record).
        </div>

        <h2>1. Identificación del prestador y contacto</h2>
        <p>
          <strong>LavaYA!</strong> es una plataforma de software como servicio (SaaS) desarrollada para la gestión operativa y de caja de lavaderos de autos y motos, fundada y operada de forma independiente por <strong>Abel</strong> (Titular y desarrollador titular), con base operativa en Asunción, República del Paraguay.
        </p>
        <p>
          <strong>Canal oficial de atención al cliente y soporte:</strong><br />
          • Correo electrónico de soporte: <a href="mailto:soporte.lavaya@gmail.com" style={{ color: '#1b4d2e', fontWeight: 600 }}>soporte.lavaya@gmail.com</a><br />
          • Asistencia directa para usuarios activos a través del panel de control de la plataforma.<br />
          • Horario de atención: Lunes a Sábado de 07:00 a 19:00 (Hora de Paraguay, UTC-3).
        </p>

        <h2>2. Comerciante de Registro (Merchant of Record - Paddle)</h2>
        <p>
          Los cobros, la facturación internacional y la gestión de impuestos sobre las ventas para todas las suscripciones de LavaYA! son procesados por <strong>Paddle.com Market Ltd.</strong> (en el Reino Unido) o <strong>Paddle Payments Ltd.</strong> (en la Unión Europea), actuando como <strong>Comerciante de Registro (Merchant of Record)</strong> autorizado.
        </p>
        <p>
          Al iniciar el período de prueba o contratar una suscripción, la transacción se realiza directamente con Paddle bajo sus estándares certificados PCI-DSS. Paddle es el comerciante que figura en el extracto de tu tarjeta bancaria y quien emite la factura legal de compra internacional.
        </p>

        <h2>2. Naturaleza del software y límites de responsabilidad</h2>
        <p>
          LavaYA! proporciona herramientas de recepción en pista, cambio de estados de vehículos, control de métodos de pago en Guaraníes (efectivo, transferencia bancaria y pendiente), registro de gastos menores de caja y enlace de seguimiento para clientes.
        </p>
        <p>
          <strong>Aviso tributario importante:</strong> LavaYA! es exclusivamente una herramienta de gestión operativa interna y arqueo de caja. No constituye un sistema de facturación electrónica tributaria (e-Kuatia / DNIT) ni sustituye las obligaciones legales, fiscales o contables del lavadero.
        </p>

        <h2>3. Prueba gratuita de 7 días y activación con tarjeta</h2>
        <p>
          El acceso inicial a cualquiera de los planes de LavaYA! incluye un período de <strong>prueba gratuita de siete (7) días corridos</strong>. Para activar la prueba, el proveedor de pagos internacional solicita el registro de un método de pago válido (tarjeta de crédito o débito) mediante un checkout seguro y encriptado.
        </p>
        <p>
          La prueba no se inicia con la mera creación de la cuenta de usuario, sino una vez confirmada la tarjeta en el checkout de la pasarela de pagos. Se concede un máximo de una (1) prueba gratuita por lavadero/negocio. Cambiar de plan durante la vigencia de la suscripción no otorga un período de prueba adicional.
        </p>

        <h2>4. Planes, renovación y facturación</h2>
        <p>
          Finalizados los 7 días de prueba, se aplicará el cargo correspondiente al plan seleccionado por el usuario:
        </p>
        <ul>
          <li><strong>Plan Mensual:</strong> US$20 cada mes (facturación recurrente mensual).</li>
          <li><strong>Plan Semestral:</strong> US$108 cada 6 meses (equivalente a US$18/mes; ahorro de US$12 por semestre frente al mensual).</li>
          <li><strong>Plan Anual:</strong> US$192 cada 12 meses (equivalente a US$16/mes; ahorro de US$48 por año frente al mensual).</li>
        </ul>
        <p>
          Los impuestos aplicables según la jurisdicción del comprador se desglosan en pantalla antes de confirmar el pago. Los cobros se renuevan automáticamente al vencer cada ciclo, a menos que el usuario cancele su suscripción previamente.
        </p>

        <h2>5. Cancelación de la suscripción y política de devoluciones</h2>
        <p>
          El usuario puede cancelar la renovación de su suscripción en cualquier momento de manera autónoma desde el panel de LavaYA! (sección Suscripción / Portal de cliente).
        </p>
        <p>
          - <strong>Cancelación durante los 7 días de prueba:</strong> Si se cancela antes del vencimiento del día 7, la tarjeta no sufrirá ningún cargo. El acceso al servicio concluirá al cumplirse los 7 días.<br />
          - <strong>Cancelación de suscripción activa:</strong> Si se cancela un plan ya facturado, el acceso al panel y sus datos permanecerá plenamente activo hasta el último día del período ya pagado. No se generan cobros futuros.<br />
          - <strong>Devoluciones:</strong> Al tratarse de un servicio digital con prueba gratuita previa de 7 días sin costo, los períodos ya devengados no son reembolsables salvo fallos técnicos graves y prolongados atribuibles a la plataforma y reportados dentro de los 14 días posteriores al cobro.
        </p>

        <h2>6. Aislamiento, exportación y conservación de datos</h2>
        <p>
          Cada lavadero dispone de un entorno aislado con base de datos particionada por negocio (aislamiento estricto multi-tenant). Ningún otro usuario o lavadero puede visualizar tus vehículos, clientes, cobros o gastos.
        </p>
        <p>
          El titular del lavadero puede solicitar en cualquier momento la exportación de sus datos históricos. Tras la cancelación definitiva de una cuenta, los datos se conservan de forma segura durante 30 días calendario por si el usuario decide reactivar su cuenta; transcurrido dicho plazo, se procede a su eliminación irreversible de los servidores principales de producción.
        </p>
      </main>
      <Footer />
    </>
  );
}
