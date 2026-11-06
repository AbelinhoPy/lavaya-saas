import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Check, Car, Wallet, Smartphone, ShieldCheck, Play, CircleCheck, Sparkles } from 'lucide-react';
import { Nav, Footer } from '@/components/brand';
import PricingTable from '@/components/pricing-table';
import ContactForm from '@/components/contact-form';

export const metadata = {
  title: 'LavaYA! · El orden que tu lavadero de autos y motos necesita',
  description:
    'SaaS de gestión operativa y caja para lavaderos de autos y motos. Control de vehículos en pista, cobros en guaraníes, gastos del día y seguimiento para tus clientes.',
};

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* HERO SECTION */}
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> GESTIÓN INTEGRAL PARA LAVADEROS
            </div>
            <h1>
              Autos y motos impecables.<br />
              Un negocio<br />
              <em>igual de claro.</em>
            </h1>
            <p className="lead">
              De la recepción en pista al último cobro del día. Organizá cada lavado, controlá cobros en efectivo o transferencias y cerrá tu caja sin perderte entre cuadernos y notas de WhatsApp.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/registro">
                Probar 7 días gratis <ArrowUpRight size={19} />
              </Link>
              <Link className="text-button" href="/demo">
                <Play size={16} /> Ver la demo interactiva
              </Link>
            </div>
            <p className="micro">
              Prueba de 7 días con tarjeta · Planes desde US$20/mes · Operación diaria en Guaraníes (Gs.) · Cancelable online
            </p>
            <div className="hero-proof">
              <ShieldCheck size={18} />
              Tu próximo centro de operaciones. Diseñado para el celular del lavadero y la computadora de recepción.
            </div>
          </div>

          <div className="hero-scene">
            <div className="scene-orbit" />
            <div className="floating-label">
              <span className="live-dot" /> PISTA EN TIEMPO REAL
            </div>

            {/* Visual Dashboard Card with Real Hero Photo Banner */}
            <div className="dashboard-preview">
              <div style={{ position: 'relative', width: '100%', height: '170px', overflow: 'hidden' }}>
                <Image
                  src="/images/hero-car-wash-foam.webp"
                  alt="Vehículo en cabina de lavado cubierto con espuma activa para limpieza profesional"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 550px"
                  style={{ objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(20,60,53,0.3) 0%, rgba(20,60,53,0.85) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, color: 'white' }}>
                  <span className="pill" style={{ background: '#d4ef7b', color: '#143c35', fontSize: 9, fontWeight: 700 }}>
                    PISTA OPERATIVA
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>Centro de Lavado y Detallado</div>
                  <small style={{ fontSize: 11, color: '#e0ebd8' }}>Operando en Guaraníes (Gs.)</small>
                </div>
              </div>

              <div className="preview-heading">
                <div>
                  <small>VISTA ILUSTRATIVA · DATOS DE EJEMPLO</small>
                  <h3>Buen día, Abel ☀</h3>
                  <span>Así se mueve tu lavadero hoy.</span>
                </div>
                <span className="date-pill">HOY</span>
              </div>

              <div className="preview-metrics">
                <div>
                  <small>Cobrado hoy en caja</small>
                  <strong>₲ 480.000</strong>
                  <span>8 servicios finalizados</span>
                </div>
                <div>
                  <small>En pista ahora</small>
                  <strong>
                    04<span> vehículos</span>
                  </strong>
                  <span>Espera, lavado y listos</span>
                </div>
              </div>

              <div className="preview-table">
                <div className="table-head">
                  <strong>Vehículos en pista</strong>
                  <span>Ver tablero completo ↗</span>
                </div>
                {[
                  ['BCF 482', 'Toyota Corolla · Lavado Completo', 'Lavando', 'mint'],
                  ['AAKD 793', 'Kia Sportage · Básico Exterior', 'En espera', 'amber'],
                  ['BCD 165', 'Honda CB 190 · Moto Completo', 'Listo', 'blue'],
                ].map((r) => (
                  <div className="vehicle-row" key={r[0]}>
                    <div className="car-icon">
                      <Car size={18} />
                    </div>
                    <div>
                      <b>{r[0]}</b>
                      <small>{r[1]}</small>
                    </div>
                    <span className={`badge ${r[3]}`}>{r[2]}</span>
                  </div>
                ))}
              </div>

              <div className="preview-bottom">
                <span>◉ Pista</span>
                <span>Vehículos</span>
                <span>Caja y Gastos</span>
                <span>Tarifas</span>
              </div>
            </div>

            <div className="floating-receipt">
              <span className="receipt-icon">
                <CircleCheck size={22} />
              </span>
              <div>
                <b>Cobro registrado en caja.</b>
                <span>Efectivo, transferencia o pendiente.</span>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFIT STRIP */}
        <div className="benefit-strip">
          <div className="wrap">
            <span>
              <Check size={17} /> Autos, camionetas y motos
            </span>
            <span>
              <Check size={17} /> Caja con efectivo y transferencias
            </span>
            <span>
              <Check size={17} /> Enlace de seguimiento para clientes
            </span>
            <span>
              <Check size={17} /> 100% online en celular y computadora
            </span>
          </div>
        </div>

        {/* SECTIONS WITH REAL QUALITY PHOTOGRAPHS */}
        <section className="section wrap" id="funciones">
          <div className="section-heading">
            <div className="eyebrow">DISEÑADO PARA LA PISTA REAL</div>
            <h2>
              El lavado sigue su curso.<br />
              Vos tenés el control.
            </h2>
            <p>
              Un recorrido visual pensado para operadores en pista y dueños que necesitan orden financiero sin complicaciones.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
                <Image
                  src="/images/pressure-washer-bay.webp"
                  alt="Pista de lavado con equipo de hidrolavadora de alta presión preparada para el servicio"
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="feature-top">
                <Car size={24} />
                <span>01</span>
              </div>
              <h3>De la llegada a la entrega</h3>
              <p>
                Anotá la placa, auto o moto, servicio base y adicionales. Pasá cada vehículo de espera a lavado y de lavado a listo en 1 toque.
              </p>
            </article>

            <article className="feature" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
                <Image
                  src="/images/car-snow-foam.webp"
                  alt="Capa de espuma activa sobre la carrocería del vehículo"
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="feature-top">
                <Wallet size={24} />
                <span>02</span>
              </div>
              <h3>Caja del día clara y exacta</h3>
              <p>
                Diferenciá efectivo, transferencias bancarias y cobros pendientes. Registrá gastos menores de insumos y mirá el balance de caja sin sorpresas.
              </p>
            </article>

            <article className="feature" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
                <Image
                  src="/images/car-detailing-sponge.webp"
                  alt="Operador realizando limpieza y detallado manual con champú y esponja suave"
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="feature-top">
                <Smartphone size={24} />
                <span>03</span>
              </div>
              <h3>Seguimiento para tu cliente</h3>
              <p>
                Compartí un enlace privado por WhatsApp con código de seguimiento. Tu cliente sabe cuándo su auto está listo para retirar sin saturarte de mensajes.
              </p>
            </article>
          </div>
        </section>

        {/* DEMO INTERACTIVE CALLOUT */}
        <section className="demo-section wrap">
          <div>
            <div className="eyebrow">MIRALO POR DENTRO</div>
            <h2>
              Probá antes<br />
              de decidir.
            </h2>
            <p>
              Mové vehículos, agregá servicios en guaraníes y simulá cobros en efectivo o transferencias. La demo es completamente libre y no pide tarjeta ni datos de contacto.
            </p>
            <Link className="button light" href="/demo" style={{ marginTop: 16 }}>
              Abrir demo interactiva <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="workflow">
            <div>
              <span>01</span>
              <b>Llega un vehículo a pista</b>
              <small>Placa + Tipo + Servicio base + Extras</small>
            </div>
            <i>↓</i>
            <div>
              <span>02</span>
              <b>Lavado y secado</b>
              <small>Estado visible para todo el equipo en pista</small>
            </div>
            <i>↓</i>
            <div>
              <span>03</span>
              <b>Vehículo listo y cobro asentado</b>
              <small>Efectivo o transferencia asentado en la caja</small>
            </div>
          </div>
        </section>

        {/* PRICING & PROMOTIONS (SECTION 2) */}
        <section className="section wrap" id="precio" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>
              PLANES Y PROMOCIONES CONFIRMADAS
            </div>
            <h2>
              Precios simples y transparentes.<br />
              Sin sorpresas ni contratos forzados.
            </h2>
            <p className="lead" style={{ margin: '0 auto' }}>
              Elegí cómo abonar el servicio: mensualmente o aprovechando ahorros por períodos de 6 o 12 meses. Todos los planes incluyen <strong>7 días de prueba gratuita</strong> con tarjeta.
            </p>
          </div>

          <PricingTable />
        </section>

        {/* CONTACT & SUGGESTIONS SECTION */}
        <section className="section wrap" id="contacto" style={{ paddingTop: 20, paddingBottom: 60 }}>
          <ContactForm />
        </section>

        {/* FAQ SECTION */}
        <section className="section wrap faq">
          <div className="eyebrow">PREGUNTAS FRECUENTES</div>
          <h2>Todo claro antes de empezar.</h2>

          {[
            [
              '¿Tengo que instalar programas o aplicaciones en la computadora?',
              'No. LavaYA! funciona directamente desde el navegador de cualquier teléfono celular, tablet o computadora conectada a internet.',
            ],
            [
              '¿Cómo funciona la prueba gratuita de 7 días?',
              'Al registrar tu negocio y activar la suscripción en el checkout seguro, se solicita una tarjeta de crédito o débito para iniciar el período de prueba. Durante los primeros 7 días no se realiza ningún cobro. Podés cancelar en cualquier momento desde el panel antes de que venza el día 7 para evitar cargos.',
            ],
            [
              '¿Qué moneda se utiliza en el sistema?',
              'La operación diaria de tu lavadero (precios de lavados, adicionales, cobros en efectivo, transferencias y gastos de caja) funciona en Guaraníes (Gs.). La suscripción mensual al SaaS se liquida en dólares estadounidenses (USD) a través de la pasarela internacional de pagos.',
            ],
            [
              '¿Qué incluye el cierre de caja del día?',
              'El cierre calcula los cobros efectivos, transferencias bancarias y cobros pendientes por cobrar, descontando los gastos menores asentados durante la jornada. Refleja el balance operativo de caja del día (no incluye costos fijos no ingresados como alquiler o sueldos).',
            ],
            [
              '¿Pueden mis operadores acceder a las finanzas del lavadero?',
              'No. La información financiera de caja, balance, gastos y gestión de suscripción está restringida exclusivamente a la cuenta del dueño del lavadero.',
            ],
            [
              '¿Cómo comparto el estado del lavado con mi cliente?',
              'Cada vehículo registrado genera automáticamente un código y enlace seguro de seguimiento (ej: /estado/tk_...). Podés copiarlo y enviárselo al cliente por WhatsApp para que consulte si su auto está en espera, lavando o listo para retirar.',
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
