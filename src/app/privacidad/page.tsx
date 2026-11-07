import { Nav, Footer } from '@/components/brand';

export const metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos · LavaYA!',
  description: 'Tratamiento de datos, seguridad de contraseñas, aislamiento por negocio y cookies en LavaYA!.',
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="legal wrap">
        <div className="eyebrow">POLÍTICA DE PRIVACIDAD</div>
        <h1>Privacidad y Protección de Datos</h1>
        <div className="notice">
          Compromiso de confidencialidad y resguardo técnico de datos en LavaYA!. Base de datos operada en Neon PostgreSQL con cifrado en reposo y en tránsito (SSL/TLS).
        </div>

        <h2>1. Información recopilada y propósito</h2>
        <p>
          En LavaYA! recopilamos únicamente los datos mínimos indispensables para el funcionamiento técnico y administrativo del sistema:
        </p>
        <ul>
          <li><strong>Datos de tu cuenta de usuario:</strong> Correo electrónico, nombre de contacto y contraseña encriptada (con funciones de hash criptográfico de un solo sentido). Utilizados exclusivamente para autenticar tu acceso y recuperar credenciales.</li>
          <li><strong>Datos de tu lavadero:</strong> Nombre del establecimiento comercial, número de teléfono de contacto y lista personalizada de servicios y precios en Guaraníes.</li>
          <li><strong>Datos operativos de pista:</strong> Placa del vehículo, tipo (auto o moto), marca/modelo, servicio contratado, adicionales, estado en pista y medio de cobro seleccionado. Teléfono o nombre del cliente del lavadero si el operador decide anotarlo voluntariamente para enviar avisos de entrega.</li>
          <li><strong>Datos de caja:</strong> Registro de importes cobrados (efectivo y transferencias) y gastos menores operativos asentados en el arqueo del día.</li>
        </ul>

        <h2>2. Aislamiento técnico por lavadero (Multi-Tenant)</h2>
        <p>
          Toda la información operativa y financiera está vinculada estrictamente al identificador único de tu lavadero (<code>business_id</code>). Las consultas de base de datos en Neon PostgreSQL están aisladas mediante validación de sesión criptográfica en el servidor: un usuario o lavadero ajeno nunca puede consultar, listar ni modificar datos de otro establecimiento.
        </p>

        <h2>3. Consulta pública de estado por token seguro</h2>
        <p>
          El código de seguimiento generado para el cliente final (ej: <code>/estado/tk_...</code>) es un token alfanumérico aleatorio no predecible. La pantalla pública de consulta muestra exclusivamente la placa, el servicio y si el vehículo está en espera, lavando o listo. <strong>Nunca expone importes, cobros de caja, números de teléfono ni datos financieros del negocio.</strong>
        </p>

        <h2>4. Procesamiento de tarjetas y pagos</h2>
        <p>
          Los cobros de suscripción se canalizan a través de la pasarela de pagos internacional (Paddle / Merchant of Record). <strong>LavaYA! nunca recibe, almacena ni procesa números de tarjetas de crédito/débito ni códigos de seguridad CVC/CVV.</strong> Dichos datos son capturados directamente por el formulario encriptado del procesador de pagos bajo certificación PCI-DSS.
        </p>

        <h2>5. Cookies y almacenamiento de sesión</h2>
        <p>
          LavaYA! utiliza únicamente cookies técnicas de sesión (con atributos <code>httpOnly</code>, <code>SameSite=Lax</code> y <code>Secure</code> en producción). No empleamos cookies de rastreo publicitario de terceros, píxeles de remarketing ni vendemos datos de usuarios a empresas externas.
        </p>

        <h2>6. Derechos de acceso, rectificación, exportación y borrado</h2>
        <p>
          El titular del lavadero puede descargar directamente sus planillas operativas para Excel (CSV) desde la sección de Caja, o solicitar la rectificación, exportación completa o eliminación definitiva de su cuenta enviando un correo electrónico a <a href="mailto:soporte@lavaya.app" style={{ color: '#1b4d2e', fontWeight: 600 }}>soporte@lavaya.app</a> o <a href="mailto:abelnunez997@gmail.com" style={{ color: '#1b4d2e', fontWeight: 600 }}>abelnunez997@gmail.com</a>. Las eliminaciones se realizan a solicitud del titular, preservando los registros contables y fiscales exigidos por la legislación aplicable.
        </p>
      </main>
      <Footer />
    </>
  );
}
