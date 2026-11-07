# 📧 Guía de Implementación: Mailflare para Correos Empresariales en LavaYA!

Esta guía detalla los pasos para desplegar **Mailflare** ([github.com/hieunc229/mailflare](https://github.com/hieunc229/mailflare)), la solución open-source serverless de correo empresarial sobre la infraestructura de **Cloudflare**, eliminando costos mensuales por buzón (como Google Workspace o Microsoft 365) y manteniendo soberanía total de los datos.

---

## 1. Arquitectura de Mailflare en Cloudflare

Mailflare opera de forma 100% serverless dentro de tu propia cuenta de Cloudflare:

* **Inbound (Recepción de correos)**: Cloudflare Email Routing captura los correos dirigidos a tu dominio personalizado (ej. `@lavaya.app` o el dominio que vincules) y los transfiere al Worker de Mailflare.
* **Storage (Buzones y Mensajes)**: Cloudflare D1 (base de datos SQLite distribuida) guarda los correos, carpetas, contactos y reglas.
* **Attachments (Archivos adjuntos)**: Cloudflare R2 (almacenamiento de objetos sin tarifas de egreso) almacena archivos adjuntos y documentos.
* **Outbound (Envío de correos)**: Envío directo mediante Cloudflare Email Sending o mediante el API de Resend / Amazon SES ya integrado.
* **Webmail Workspace**: Interfaz web moderna para consultar bandejas de entrada, redactar correos, gestionar calendario y programar citas.

---

## 2. Buzones Empresariales para LavaYA!

Una vez inicializado Mailflare, se crean los siguientes buzones oficiales:

| Buzón | Uso Principal | Destino / Encargado |
| :--- | :--- | :--- |
| **`soporte@lavaya.app`** | Soporte técnico, atención a lavaderos, solicitudes de datos y términos legales. | Mesa de ayuda LavaYA! |
| **`contacto@lavaya.app`** | Consultas comerciales, activación de planes y formulario web de la landing. | Equipo comercial / Ing. Abel Núñez |
| **`abel@lavaya.app`** | Correo corporativo directo de dirección. | Ing. Abel Núñez (Titular) |

---

## 3. Pasos de Despliegue en Cloudflare (Recomendado)

### Paso 1: Crear el Token de API en Cloudflare (`CF_TOKEN`)
1. Ingresá a tu consola de [Cloudflare Dashboard](https://dash.cloudflare.com/) → **My Profile** → **API Tokens** → **Create Token**.
2. Asigná los siguientes permisos:
   * **Permisos de Cuenta (All accounts)**:
     * *Email Sending*: Edit
     * *DNS Settings*: Edit
     * *Email Routing Addresses*: Edit
     * *Workers D1 Storage*: Edit
     * *Workers R2 Storage*: Edit
   * **Permisos de Zona (All zones)**:
     * *DNS*: Edit
     * *Email Routing Rules*: Edit
     * *Zone Settings*: Edit
3. Guardá el token generado como `CF_TOKEN`.

### Paso 2: Desplegar el Repositorio Mailflare
Podés desplegarlo de dos formas:

#### Opción A: Despliegue en 1 clic (Deploy to Cloudflare)
1. Abrí el repositorio oficial: [https://github.com/hieunc229/mailflare](https://github.com/hieunc229/mailflare)
2. Hacé clic en el botón **"Deploy to Cloudflare"**.
3. **Importante**: Mantené el nombre de la aplicación como `mailflare` (cambiar el nombre puede romper las rutas internas de los Workers).
4. Ingresá el `CF_TOKEN` cuando te lo solicite el asistente de Cloudflare.

#### Opción B: Despliegue por línea de comandos (CLI)
```bash
# Clonar el repositorio
git clone https://github.com/hieunc229/mailflare.git
cd mailflare

# Instalar dependencias
npm install

# Autenticarte con Cloudflare Wrangler
npx wrangler login

# Desplegar Worker, D1 y R2
npx wrangler deploy
```

### Paso 3: Inicialización y Creación de Cuenta Administrador
1. Una vez finalizado el despliegue, Cloudflare te dará la URL pública de tu Worker (ej. `https://mailflare.tudominio.workers.dev`).
2. Abrí en el navegador:
   ```
   https://mailflare.tudominio.workers.dev/setup
   ```
3. Completá el asistente de bienvenida:
   - Definí tu contraseña de administrador.
   - Creá tu primer buzón principal: `abel@lavaya.app` o `contacto@lavaya.app`.

### Paso 4: Conectar tu Dominio
1. Dentro del panel de Mailflare, andá a **Domains** → **Add Domain**.
2. Escribí tu dominio (ej. `lavaya.app`).
3. Mailflare configurará automáticamente o te indicará los registros DNS necesarios en Cloudflare:
   - **Registros MX** (para recibir tráfico de correo).
   - **Registro TXT SPF** (`v=spf1 include:_spf.mx.cloudflare.net ~all`).
   - **Registro TXT DKIM** (para garantizar que tus correos no caigan en spam).

---

## 4. Conexión con LavaYA! SaaS (Vercel)

Una vez que tus correos empresariales estén activos en Mailflare, conectá LavaYA! actualizando las variables de entorno en Vercel:

| Variable | Valor Recomendado | Descripción |
| :--- | :--- | :--- |
| `EMAIL_FROM` | `LavaYA! <contacto@lavaya.app>` | Remitente visible de las notificaciones |
| `CONTACT_RECIPIENT_EMAIL` | `contacto@lavaya.app` | Casilla que recibe los mensajes del formulario web |
| `SUPPORT_EMAIL` | `soporte@lavaya.app` | Casilla de soporte técnico en términos y privacidad |

En local (`.env.local`), podés seguir usando el reenvío o fallback a `abelnunez997@gmail.com` hasta que el dominio en Cloudflare esté 100% apuntado.
