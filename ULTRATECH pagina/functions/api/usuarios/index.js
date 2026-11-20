// GET /api/usuarios — listado de usuarios registrados (solo admin).
import { getDb } from "../../_lib/db.js";
import { handle, json } from "../../_lib/http.js";
import { listUsers, requireAdmin } from "../../_lib/auth.js";

export const onRequestGet = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  return json({ users: await listUsers(db) });
});
