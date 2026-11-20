# ULTRATECH · Tienda online

Tienda de componentes de PC, laptops, celulares y accesorios, con cotización de páginas web.
**Cloudflare Pages + Cloudflare Functions + Turso (libSQL)**. Frontend en HTML/CSS/JS modular (sin frameworks).

```
/
├── index.html            Tienda
├── Admin.html            Panel de administración (protegido por rol)
├── functions/
│   ├── _lib/             http, db (Turso), schema, auth, validate, orders, nequi
│   └── api/              productos · pedidos · usuarios · nequi · contenido · cotizaciones · health
├── images/
├── Scripts/              shared/ (api, session, utils) · store/ · admin/
└── Styles/               base.css · store.css · admin.css
```

## Despliegue en Cloudflare

1. **Turso**: `turso db create ultratech` → `turso db show ultratech --url` → `turso db tokens create ultratech`.
   Las tablas y productos demo se crean solos en la primera petición.
2. **Cloudflare Pages** → conectar el repositorio con:
   - Build command: `mkdir -p dist && cp -r index.html Admin.html images Scripts Styles dist/`
   - Build output directory: `dist`
3. **Settings → Variables and Secrets**: define las claves de `.dev.vars.example`
   (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `ADMIN_EMAIL` y las `NEQUI_*`).
4. **Administrador**: regístrate en la tienda con el correo definido en `ADMIN_EMAIL` y entra a `/Admin.html`.

Local: `cp .dev.vars.example .dev.vars && npm i && mkdir -p dist && cp -r index.html Admin.html images Scripts Styles dist/ && npx wrangler pages dev dist`

## Habilitar cobros con Nequi

Las variables `NEQUI_*` (marcadas en `functions/_lib/nequi.js` y `.dev.vars.example`) activan el flujo
**Pagos con notificación Push** de Nequi Conecta: `POST /api/nequi/pagar` envía el cobro al celular del cliente y
`GET /api/nequi/estado` consulta el resultado (35 = pagado) y marca el pedido como `pagado`.
Sin credenciales, el checkout muestra un mensaje indicando qué variables faltan. `NEQUI_MOCK=true` simula el cobro para pruebas.

## Seguridad

Contraseñas con PBKDF2-SHA256, sesión firmada con HMAC en cookie HttpOnly, rol verificado en BD en cada endpoint
de administración, precios y totales calculados en el servidor, y todo el HTML dinámico escapado.

> La carpeta `src/` y `next.config.ts` existen solo para la vista previa del sandbox; no forman parte del despliegue.
