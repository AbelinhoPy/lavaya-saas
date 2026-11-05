# LavaYA! — SaaS de Gestión Operativa para Lavaderos de Autos y Motos

Plataforma SaaS full-stack para dueños de lavaderos de autos y motos. Nombre confirmado: **LavaYA!**. Precio base confirmado: **US$20/mes** con opciones de ahorro semestral y anual, todos con **7 días de prueba gratis con tarjeta**.

- **Ubicación canónica del proyecto:** `C:\Users\abelk\Desktop\SaaS Lavadero`
- **Base de datos:** Neon PostgreSQL (Serverless) con conexión segura y migraciones versionadas.
- **Autenticación:** Better Auth integrado nativamente sobre Neon PostgreSQL (sesiones en servidor, cookies httpOnly / secure / sameSite, protección anti-abuso y recuperación de contraseña).
- **Procesador de pagos:** Paddle (Merchant of Record) con suscripción multi-plan (mensual, semestral, anual), prueba de 7 días con tarjeta requerida, firmas HMAC SHA256, deduplicación y bloqueos consultivos (advisory locks).
- **Moneda operativa:** Guaraníes (Gs.) para precios, servicios, adicionales, cobros y caja diaria; suscripción al software en USD.
- **Hosting de producción:** Vercel (https://lavaya-toman13.vercel.app).
- **Repositorio de producción:** https://github.com/AbelinhoPy/lavaya-saas

---

## 🚀 Inicio Rápido Local

Requisitos: Node.js 20 o superior.

```powershell
cd "C:\Users\abelk\Desktop\SaaS Lavadero"
npm install
npm run dev
```

Abrir [http://localhost:3100](http://localhost:3100) en el navegador.

### Comandos de Verificación y Calidad

- `npm run typecheck`: Comprobación estricta de tipos de TypeScript (`tsc --noEmit`).
- `npm test`: Ejecuta las suites de pruebas unitarias:
  1. `tests/billing.test.cjs`: Firmas HMAC de webhooks, protección contra alteración/replay, cálculo de vencimientos, validación estricta de los 3 planes de Paddle con prueba de 7 días, validación de placas y transiciones de estado secuenciales.
  2. `tests/tenant-isolation.test.cjs`: Prueba de aislamiento multi-inquilino entre dos negocios independientes (comprobando que el negocio A no puede ver ni modificar trabajos o gastos del negocio B ni con accesos directos por ID).
- `npm run build`: Compilación optimizada para producción con Next.js (24 páginas y rutas estáticas/dinámicas).
- `npm run db:migrate`: Aplica las migraciones versionadas contra Neon PostgreSQL.

---

## 🛠️ Qué funciona sin servicios externos (Offline / Modo Demo)

1. **Página de aterrizaje comercial (`/`):**
   - Presentación moderna en verde profundo, blanco cálido y acentos lima.
   - Fotografías reales de alta calidad en WebP con dimensiones optimizadas y carga diferida (`public/images/`), con licencias documentadas en `ASSETS-LICENSES.md`.
   - Selector interactivo de planes: Mensual (US$20/mes), Semestral (US$108 cada 6 meses, 10% ahorro) y Anual (US$192 cada 12 meses, 20% ahorro).
   - Vista ilustrativa del centro de operaciones y recibo de cobro.
   - Preguntas frecuentes y enlaces legales.
2. **Demo interactiva completa (`/demo`):**
   - Pista operativa Kanban: En espera → Lavando → Listo → Entregado (con confetti).
   - Modal de recepción rápida: Selección Auto 🚗 / Moto 🏍️, placa con formato paraguayo, servicio base y adicionales (encerado, tapizado, silicona).
   - Modal de cobro con diferenciación transparente: **Efectivo**, **Transferencia** y **Pendiente**.
   - Caja del día: Resumen de cobros efectivo vs transferencia, cobros pendientes separados, gastos menores de insumos y balance operativo de caja.
   - Catálogo de servicios con edición interactiva de precios en Guaraníes.
   - Demostración de enlace de seguimiento por token para clientes (`/estado/[token]`).
   - Todos los cambios de la demo se ejecutan en memoria local y no alteran la base de datos de producción.
3. **Consulta pública de seguimiento (`/estado/[token]` y `/estado/consulta`):**
   - El cliente ingresa su código seguro (ej: `tk_a1b2c3d4e5f6`) y consulta el avance en pista (En espera → Lavando → Listo → Entregado).
   - Información estrictamente pública: placa, servicio y estado. **Nunca expone caja, gastos, teléfonos ni importes privados.**
4. **Pantallas de autenticación (`/ingresar`, `/registro`, `/recuperar`, `/restablecer`):**
   - Formularios preparados con Better Auth y Neon. Si `DATABASE_URL` no está conectada, muestra aviso preventivo sin errores fatales.
5. **Páginas legales (`/terminos` y `/privacidad`):**
   - Información completa sobre identidad, contacto, facturación, política de devoluciones, cancelación y tratamiento de datos con aislamiento multi-inquilino.

---

## 🐘 Conectar Neon PostgreSQL

1. Crear un proyecto en [Neon Console](https://console.neon.tech).
2. Copiar la cadena de conexión con connection pooling (`pooled` / `neondb`).
3. En tu archivo `.env.local` (o en las variables de entorno de Vercel), configurar:
   ```env
   DATABASE_URL="postgres://[usuario]:[password]@[endpoint-neon].pooler.neon.tech/neondb?sslmode=require"
   BETTER_AUTH_SECRET="generar_clave_aleatoria_de_32_bytes"
   NEXT_PUBLIC_SITE_URL="https://tu-proyecto.vercel.app"
   ```
4. Aplicar las migraciones versionadas:
   ```powershell
   $env:DATABASE_URL="postgres://..."
   npm run db:migrate
   ```
   El script `scripts/migrate.cjs` ejecutará `sql/migrations/001_initial_neon.sql` y creará la tabla `_migrations` para registrar versiones aplicadas.

---

## 💳 Cobros y Suscripciones (Paddle Sandbox)

**Importante:** `BILLING_ENABLED=false` por defecto. El backend nunca recibe ni procesa números de tarjeta (PAN/CVC); la tarjeta se ingresa exclusivamente dentro del checkout seguro de Paddle.

### Pasos para configurar Paddle:
1. Registrarse en [Paddle](https://paddle.com) en modo **Sandbox**.
2. Crear un producto: **LavaYA! - Sistema para Lavaderos**.
3. Crear los 3 precios recurrentes en USD, con **7 días de prueba gratis que requieren tarjeta** (`requires_payment_method: true`):
   - **Mensual:** US$20.00 (`amount: 2000`), ciclo: 1 mes.
   - **Semestral:** US$108.00 (`amount: 10800`), ciclo: 6 meses.
   - **Anual:** US$192.00 (`amount: 19200`), ciclo: 12 meses (o 1 año).
4. Copiar los IDs de precio en el entorno:
   ```env
   PADDLE_PRICE_ID_MONTHLY="pri_..."
   PADDLE_PRICE_ID_SEMIANNUAL="pri_..."
   PADDLE_PRICE_ID_ANNUAL="pri_..."
   PADDLE_API_KEY="paddlev2_..."
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_... o test_..."
   ```
5. En Paddle Sandbox, crear un webhook apuntando a `https://tu-proyecto.vercel.app/api/billing/webhook`.
   - Habilitar eventos de suscripción (`subscription.created`, `subscription.trialing`, `subscription.activated`, `subscription.updated`, `subscription.past_due`, `subscription.paused`, `subscription.resumed`, `subscription.canceled`).
   - Copiar la clave secreta generada en `PADDLE_WEBHOOK_SECRET`.
6. Al completar las pruebas sandbox de ciclo de vida (inicio de prueba, cancelación antes de cobrar, renovación y fallo de pago), solicitar la activación de vendedor y cambiar `BILLING_ENABLED=true`.

### Cómo recibe Abel el dinero de las suscripciones
- **Rol de Paddle:** Paddle opera como *Merchant of Record* (comerciante registrado), encargándose del cobro con tarjeta, prevención de fraude e impuestos internacionales.
- **Comisiones oficiales:** 5% + US$0,50 por transacción exitosa.
  - Sobre un pago de US$20/mes, la comisión de Paddle es de US$1,50; el saldo neto antes de retenciones o costos de transferencia es de aprox. US$18,50.
  - Sobre el plan semestral (US$108), la comisión es de US$5,90 (quedan US$102,10).
  - Sobre el plan anual (US$192), la comisión es de US$10,10 (quedan US$181,90).
- **Cobro en Paraguay:** Paddle liquida los fondos de forma mensual (al alcanzar el umbral mínimo de US$100). Para vendedores en Paraguay, el retiro se realiza habitualmente vía **Payoneer** (cuenta virtual bancaria en USD) o transferencia bancaria internacional directa (SWIFT) a una cuenta bancaria habilitada en Paraguay. Se deben considerar los costos de recepción bancaria local o conversión de divisas.

---

## 🌐 Despliegue en Vercel

1. Subir el repositorio a GitHub:
   ```powershell
   git remote add origin https://github.com/tu-usuario/saas-lavadero.git
   git branch -M main
   git push -u origin main
   ```
2. En [Vercel](https://vercel.com), importar el repositorio como proyecto Next.js.
3. Cargar las variables de entorno de producción desde `.env.example`:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
   - `PADDLE_ENVIRONMENT` (sandbox o production)
   - `PADDLE_API_KEY`
   - `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
   - `PADDLE_PRICE_ID_MONTHLY`, `PADDLE_PRICE_ID_SEMIANNUAL`, `PADDLE_PRICE_ID_ANNUAL`
   - `PADDLE_WEBHOOK_SECRET`
   - `BILLING_ENABLED`
4. **Nota sobre planes de Vercel:** El plan *Vercel Hobby* es para proyectos personales no comerciales. Para comercializar formalmente suscripciones de pago a terceros, se debe contratar un plan Vercel Pro o compatible.

---

## 🔍 Google Search Console & SEO

1. `robots.txt` y `sitemap.xml` se generan dinámicamente con las URLs canónicas del sitio en `/api/seo/robots` y `/api/seo/sitemap`.
2. Las rutas privadas `/panel`, `/api/*` y flujos de autenticación están bloqueadas para los motores de búsqueda mediante encabezados `X-Robots-Tag: noindex` y reglas en `robots.txt`.
3. Para dar de alta en Google Search Console:
   - Crear propiedad de tipo **Prefijo de la URL** con la dirección https definitiva (ej: `https://lavaya.vercel.app`).
   - Verificar mediante etiqueta meta HTML o registro DNS.
   - Enviar sitemap: `https://tu-dominio.com/sitemap.xml`.

---

## 📋 Lista de tareas pendientes que Abel debe completar

1. [ ] Crear base de datos en [Neon.tech](https://neon.tech) y ejecutar `npm run db:migrate` con el `DATABASE_URL`.
2. [ ] Crear cuenta en [Paddle](https://paddle.com) (Sandbox) y configurar los 3 precios (Mensual US$20, Semestral US$108, Anual US$192) con 7 días de prueba con tarjeta.
3. [ ] Configurar el webhook de Paddle hacia la URL desplegada en Vercel.
4. [ ] Verificar en Paddle la habilitación del método de retiro para Paraguay (Payoneer o transferencia bancaria).
5. [ ] Configurar las variables en el panel de Vercel y realizar el despliegue a producción.
