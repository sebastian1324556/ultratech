// GET /api/contenido — textos y banners de la web (público).
// PUT /api/contenido — personaliza textos y banners (solo admin).
import { getDb, first } from "../../_lib/db.js";
import { HttpError, handle, json, readJson, text } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { DEFAULT_CONTENT } from "../../_lib/schema.js";

const SETTINGS_KEY = "site_content";

async function loadContent(db) {
  const row = await first(db, "SELECT value FROM settings WHERE key = ?", [SETTINGS_KEY]);
  return { ...DEFAULT_CONTENT, ...(row ? JSON.parse(row.value) : {}) };
}

export const onRequestGet = handle(async ({ env }) => json({ content: await loadContent(await getDb(env)) }));

export const onRequestPut = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  const body = await readJson(context.request);

  const content = {};
  for (const key of Object.keys(DEFAULT_CONTENT)) {
    content[key] = text(body[key] ?? DEFAULT_CONTENT[key], { label: key, max: 600 });
  }
  if (content.heroImage && !/^(https?:\/\/|\/)/.test(content.heroImage)) {
    throw new HttpError(400, "El banner debe ser una URL válida");
  }

  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [SETTINGS_KEY, JSON.stringify(content)],
  });
  return json({ content });
});
