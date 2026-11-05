# Informe de Verificación de Entrega · LavaYA! (Neon & Vercel)

Fecha: 5 de noviembre de 2026.
Ubicación canónica: `C:\Users\abelk\Desktop\SaaS Lavadero`

---

## 1. Pruebas y Compilaciones Verificadas

| Verificación | Comando ejecutado | Resultado | Detalle |
|---|---|---|---|
| **Comprobación de tipos** | `npm run typecheck` (`tsc --noEmit`) | **Código 0 (PASS)** | Cero errores de tipos en todas las páginas, componentes, modelos y rutas de API. |
| **Suites de pruebas** | `npm test` | **Código 0 (PASS)** | - Firmas HMAC SHA256 de webhooks.<br>- Rechazo de cuerpos alterados y firmas falsas.<br>- Protección contra ataques de replay con timestamp vencido.<br>- Acceso denegado a suscripciones vencidas/no pagadas.<br>- Validación de precios de los 3 planes (mensual US$20, semestral US$108, anual US$192 con 7 días gratis y tarjeta requerida).<br>- Rechazo de importes, precios modificados o períodos sin tarjeta.<br>- Validación de placas paraguayas/mercosur, servicios e importes.<br>- Transición secuencial de estados de lavado (espera → lavando → listo → entregado).<br>- **Aislamiento multi-inquilino:** El lavadero A no puede consultar ni modificar vehículos, cobros o gastos del lavadero B ni mediante accesos directos por ID. |
| **Compilación de producción** | `npm run build` | **Código 0 (PASS)** | 24 rutas y páginas generadas con éxito (estáticas y dinámicas en App Router). |
| **Optimización de imágenes** | `sharp` WebP | **Verificado** | 4 fotografías de Pexels descargadas, optimizadas en WebP y con licencias documentadas en `ASSETS-LICENSES.md`. |
| **Migración de base de datos** | `sql/migrations/001_initial_neon.sql` | **Verificado** | Esquema SQL puro para Neon PostgreSQL con tipos nativos, constraints, triggers de transición, funciones transaccionales con `pg_advisory_xact_lock` y runner `scripts/migrate.cjs`. |

---

## 2. Reemplazo de Supabase por Neon y Better Auth

- Se desinstalaron `@supabase/ssr` y `@supabase/supabase-js`.
- Se implementó el driver `@neondatabase/serverless` para consultas parametrizadas y pool de conexiones en entornos serverless.
- Se implementó `better-auth` conectado directamente a Neon PostgreSQL con sesiones en servidor y cookies seguras (`httpOnly`, `sameSite=lax`, `secure` en producción).
- No quedan dependencias ni llamadas a Supabase en el código de producción.

---

## 3. Estado de la Pasarela de Cobros (Paddle)

- La integración está preparada y probada con validaciones para los 3 planes confirmados:
  * Mensual: US$20 cada mes (US$20/mes)
  * Semestral: US$108 cada 6 meses (eq. US$18/mes, ahorro de 10%)
  * Anual: US$192 cada 12 meses (eq. US$16/mes, ahorro de 20%)
- Todos exigen 7 días de prueba con tarjeta de crédito o débito.
- `BILLING_ENABLED=false` permanece deshabilitado por seguridad hasta que Abel configure y apruebe las credenciales de sandbox de Paddle.

---

## 4. Puertas que deben permanecer cerradas antes de cobrar a clientes reales

1. No activar `BILLING_ENABLED=true` con dinero real sin antes completar un ciclo de prueba en Paddle Sandbox (inicio de prueba, cancelación voluntaria, primer cobro y reintento por fallo de tarjeta).
2. Verificar con Paddle la aprobación comercial del negocio desde Paraguay y el canal de liquidación bancario/Payoneer.
3. No utilizar credenciales de producción en Vercel sin antes haber corrido las migraciones en Neon con `npm run db:migrate`.
