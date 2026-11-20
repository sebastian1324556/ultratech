// POST /api/cotizaciones — formulario de contacto para cotizar páginas web (público).
// GET /api/cotizaciones — solicitudes recibidas (solo admin).
import { getDb, all } from "../../_lib/db.js";
import { handle, json, readJson, text } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { parseEmail } from "../../_lib/validate.js";

export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request);
  const quote = {
    name: text(body.name, { label: "nombre", required: true, max: 100 }),
    email: parseEmail(body.email),
    phone: text(body.phone, { label: "teléfono", max: 20 }),
    projectType: text(body.projectType, { label: "tipo de proyecto", max: 60 }),
    message: text(body.message, { label: "mensaje", required: true, max: 2000 }),
  };
  const db = await getDb(env);
  await db.execute({
    sql: "INSERT INTO quotes (name, email, phone, project_type, message) VALUES (?, ?, ?, ?, ?)",
    args: [quote.name, quote.email, quote.phone, quote.projectType, quote.message],
  });
  return json({ ok: true }, 201);
});

export const onRequestGet = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  return json({ quotes: await all(db, "SELECT * FROM quotes ORDER BY id DESC LIMIT 200") });
});
