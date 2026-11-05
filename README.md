# LavaYA!

Primera versión local del SaaS para lavaderos de Abel. Nombre y precio confirmados: **LavaYA!**, **US$20/mes**, prueba gratuita de **7 días con tarjeta**. No hay cuentas de proveedor ni cobros reales conectados. El proyecto original del Escritorio no se modificó.

## Abrir

Node 20 o superior. En esta carpeta:

```powershell
npm ci
npm run dev
```

Abrir http://localhost:3100. `npm run build` verifica la compilación para producción; `npm test` verifica firmas de pago, vencimientos, tarifa, entradas y transiciones. `npm run typecheck` comprueba TypeScript.

## Qué funciona sin servicios externos

- Página pública adaptable a celular y escritorio, marca, funciones, vista ilustrativa, precio, FAQ y condiciones preliminares.
- `/demo`: tablero con vehículos ficticios. Permite registrar, avanzar estados y cobrar en efectivo o transferencia. No persiste al recargar; no envía datos a la base.
- Pantallas `/registro`, `/ingresar`, `/recuperar`, `/restablecer`, con aviso explícito si el servicio de cuentas no está conectado.
- `/robots.txt` y `/sitemap.xml`, generados con NEXT_PUBLIC_SITE_URL.

## Conectar cuentas y datos

1. Crear un proyecto **nuevo** de Supabase. No aplicar este esquema sobre el proyecto viejo sin preparar una migración.
2. Revisar y ejecutar `supabase/001_lavaya.sql`. Crea un negocio por propietario, trabajos, suscripciones, registros de checkout y eventos de pago.
3. Copiar `.env.example` a `.env.local` y completar URL, clave pública y clave service-role. Nunca compartir ni subir la service-role. No se copiaron credenciales del Escritorio.
4. Configurar Site URL y redirects exactos: `http://localhost:3100/auth/callback` y la URL definitiva de producción. Habilitar confirmación de correo, servicio SMTP, límites de autenticación y protección antiabuso para lanzamiento.
5. Registro y recuperación funcionan mediante Supabase; cookies httpOnly, Secure en producción, SameSite=Lax. Una cuenta no activa un período gratis por sí sola.
6. Antes de usar con clientes, probar el esquema en el entorno de prueba con dos propietarios y accesos directos a la API/base. Las políticas restringen los trabajos al negocio y a la suscripción vigente; no se comprobaron contra un servidor real en esta entrega.

## Cobro mensual y prueba con tarjeta

**Paddle sandbox primero.** No hay formulario propio de tarjeta. Paddle recoge la tarjeta en su checkout. El backend nunca debe recibir PAN/CVC.

1. Crear cuenta de vendedor y verificar que Paddle aprueba este negocio desde Paraguay, su identidad y el método de retiro real (banco o Payoneer, según habilitación). País admitido no garantiza aprobación ni retiro particular.
2. Crear producto y precio recurrente: moneda USD, amount `2000`, ciclo `{interval:'month',frequency:1}`, prueba `{interval:'day',frequency:7,requires_payment_method:true}` sin `unit_price` de prueba ni overrides. Cantidad uno.
3. Configurar dominio/default payment link en Paddle, token de cliente y API key de sandbox. El checkout usa `/panel` como destino de retorno. Configurar permisos API mínimos para precios, transacciones y portal.
4. Crear destino webhook `/api/billing/webhook`, habilitar eventos `subscription.created`, `subscription.trialing`, `subscription.activated`, `subscription.updated`, `subscription.past_due`, `subscription.paused`, `subscription.resumed` y `subscription.canceled`. Copiar su secreto al entorno.
5. Completar PADDLE_PRICE_ID y demás variables; BILLING_ENABLED permanece `false` hasta terminar la configuración. Habilitar solo sandbox al probar.
6. La creación de checkout exige sesión y autorización de renovación; comprueba tarifa/prueba consultando a Paddle. El registro del transaction_id relaciona eventos con el negocio desde el servidor. Los eventos deben tener HMAC válido y timestamp reciente; SQL deduplica eventos y descarta actualizaciones antiguas. Solo períodos active/trialing no vencidos habilitan datos.
7. Si los eventos llegan antes de guardar el checkout o fuera de orden, se devuelve error para permitir reintento. El primer evento debe incluir transaction_id válido; comprobar este flujo con eventos sandbox reales. No se concede acceso por parámetros URL ni por el retorno del navegador.
8. El portal autenticado permite gestionar la suscripción/cancelar. Un negocio con suscripción anterior debe usar ese portal, no recibir otra prueba automáticamente. El guardado de checkout evita aperturas repetidas durante 10 minutos.

## Dinero que recibe Abel

El comprador paga al proveedor. Paddle descuenta sus comisiones, ajustes y obligaciones que le correspondan como merchant of record; el saldo se liquida al método de retiro aprobado según su calendario y umbral vigentes. Su precio público consultado el 5/11/2026 es 5% + US$0,50 por operación: sobre una base de US$20 serían US$1,50 y quedarían US$18,50 antes de otros cargos, impuestos o ajustes. Su ayuda indica liquidación mensual con umbral mínimo US$100 y envío hasta el día 15. Confirmar condiciones concretas, conversión y cargos del banco. No se abrió una cuenta bancaria, no se configuraron retiros y no se verificó una liquidación real.

Documentación oficial:
- https://developer.paddle.com/build/trials/create-trial/
- https://developer.paddle.com/webhooks/about/signature-verification/
- https://developer.paddle.com/build/customers/integrate-customer-portal/
- https://developer.paddle.com/build/go-live-checklist/
- https://www.paddle.com/help/manage/get-paid
- https://www.paddle.com/pricing
- https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid
- https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle

## Publicar en Vercel

Importar esta carpeta como proyecto Next.js y configurar variables por entorno. Cambiar NEXT_PUBLIC_SITE_URL a la URL https definitiva, añadir redirect exacto de Supabase y configurar el dominio en Paddle. Vercel genera dirección `.vercel.app`; no hace falta comprar un dominio para la primera publicación. **El plan Hobby no admite uso comercial**: elegir un plan compatible antes de vender, no activar una suscripción de hosting sin autorización.

https://vercel.com/docs/plans/hobby

Search Console: propiedad de prefijo de URL, verificar con etiqueta y enviar sitemap. No se garantiza indexación ni posición. Las rutas de cuentas/panel no deben indexarse y los datos reales están protegidos por sesión/RLS, no por robots.txt.

## Pendientes antes de cobrar a clientes

- Completar identidad del prestador, contacto real, condiciones de devolución, exportación, conservación y eliminación de datos. Las páginas legales se identifican como preliminares.
- Configurar y probar Supabase, SMTP y Paddle sandbox; validar aislamiento entre dos negocios, transiciones, período vencido, webhooks repetidos/alterados, cancelación durante prueba y primer cobro. Luego prueba controlada de liquidación al método de retiro aprobado.
- Verificar copias de seguridad y restauración, monitoreo de fallos de webhook, límites de abuso y dependencia/versión soportada antes de producción. No activar checkout real solamente porque la página se ve terminada.
- Elegir si migrar las funciones del lavadero original: gastos, servicios configurables y vista pública por token. Esta versión conserva el flujo central de vehículos/cobros; no anuncia comisiones, personal ilimitado, facturación fiscal ni sincronización instantánea que aún no tiene.

No se publicaron testimonios inventados, logos de clientes ni cifras reales de usuarios. Los importes y placas de la página y demo son ilustrativos.
