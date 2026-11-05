# Verificación de la entrega local

5 de noviembre de 2026.

## Comprobado

- `next build`: compilación de producción completa, generación de 20 páginas/rutas y comprobación de tipos. Hubo intentos con EPERM al crear directorios concurrentes en el sandbox de Windows. La última compilación terminó con código 0 usando un helper local de QA (`work/next-fs-retry.cjs`) que reintenta el mismo mkdir de forma síncrona sin cambiar permisos. El helper no forma parte del código de la aplicación ni del paquete distribuido.
- `tsc --noEmit`: código 0.
- `node tests/billing.test.cjs`: firmas HMAC correctas, cuerpo alterado, secreto incorrecto, timestamp vencido, cabecera malformada, período vencido/no pagado, tarifa, prueba con tarjeta, importes y transiciones.
- HTML generado de inicio: marca LavaYA!, US$20, ausencia de precio anterior. HTML de demo generado con indicación de datos ficticios y formulario de vehículos.
- Servidor de producción arrancó y anunció listo. Se detuvo al terminar para no dejar procesos ocupando el puerto.
- Vista HTML autocontenida generada en `LavaYA-vista-previa.html` para revisar el diseño. Es una vista estática, no sustituye la aplicación ejecutada.

## No comprobado

- Vista visual en navegador: la apertura de localhost desde el navegador terminó por timeout. Un intento HTTP desde el entorno de ejecución devolvió EACCES. No se afirma que pasaron pruebas HTTP ni interacción visual.
- Supabase y Paddle reales: no hay credenciales conectadas. No se probaron envío de correo, confirmación, recuperación, SQL/RLS en servidor, checkout sandbox, webhooks reales, cancelación, renovación ni liquidación bancaria.
- No se desplegó en Vercel ni se compró dominio/hosting. Tampoco se publicó como servicio comercial en otro alojamiento.
- La versión de Next reutilizada del proyecto existente compiló como 14.2.35. Hace falta revisar soporte, actualizaciones y dependencias para lanzamiento comercial; no se declara una auditoría de seguridad de producción.

## Puertas que deben permanecer cerradas

- `BILLING_ENABLED=false` hasta la prueba completa con sandbox y la aprobación del vendedor/método de retiro.
- No usar datos reales hasta verificar aislamiento de dos negocios y copias/restauración.
- No reemplazar condiciones preliminares por una afirmación de cumplimiento sin completar responsable, soporte, devoluciones y conservación.
