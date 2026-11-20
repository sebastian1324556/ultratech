// POST /api/usuarios/registro — crea una cuenta y abre sesión.
import { getDb, first } from "../../_lib/db.js";
import { handle, json, readJson, text, HttpError } from "../../_lib/http.js";
import { hashPassword, publicUser, roleForEmail, sessionCookie } from "../../_lib/auth.js";
import { parseEmail, parsePhone } from "../../_lib/validate.js";

export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request);
  const name = text(body.name, { label: "nombre", required: true, max: 100 });
  const email = parseEmail(body.email);
  const phone = parsePhone(body.phone);
  const password = text(body.password, { label: "contraseña", required: true, max: 100 });
  if (password.length < 8) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres");

  const db = await getDb(env);
  if (await first(db, "SELECT id FROM users WHERE email = ?", [email])) {
    throw new HttpError(409, "Ya existe una cuenta con ese correo");
  }

  const role = roleForEmail(env, email);
  const result = await db.execute({
    sql: "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    args: [name, email, phone, await hashPassword(password), role],
  });
  const user = { id: Number(result.lastInsertRowid), name, email, phone, role };

  return json({ user: publicUser(user) }, 201, { "set-cookie": await sessionCookie(request, env, user) });
});
