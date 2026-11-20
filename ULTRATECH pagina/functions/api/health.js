// GET /api/health — comprueba que la API y la base de datos responden.
import { getDb } from "../_lib/db.js";
import { handle, json } from "../_lib/http.js";

export const onRequestGet = handle(async ({ env }) => {
  const db = await getDb(env);
  await db.execute("SELECT 1");
  return json({ ok: true });
});
