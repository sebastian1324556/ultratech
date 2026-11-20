// GET /api/usuarios/me — usuario de la sesión actual (o null).
import { getDb } from "../../_lib/db.js";
import { handle, json } from "../../_lib/http.js";
import { currentUser, publicUser } from "../../_lib/auth.js";

export const onRequestGet = handle(async (context) => {
  const db = await getDb(context.env);
  const user = await currentUser(context, db);
  return json({ user: user ? publicUser(user) : null });
});
