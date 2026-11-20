// POST /api/usuarios/login — valida credenciales y abre sesión.
import { getDb, first } from "../../_lib/db.js";
import { handle, json, readJson, text, HttpError } from "../../_lib/http.js";
import { publicUser, roleForEmail, sessionCookie, verifyPassword } from "../../_lib/auth.js";

export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request);
  const email = text(body.email, { label: "correo", required: true, max: 160 }).toLowerCase();
  const password = text(body.password, { label: "contraseña", required: true, max: 100 });

  const db = await getDb(env);
  const user = await first(db, "SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  // Si el correo coincide con ADMIN_EMAIL, se garantiza el rol admin.
  const role = roleForEmail(env, email) === "admin" ? "admin" : user.role;
  if (role !== user.role) {
    await db.execute({ sql: "UPDATE users SET role = ? WHERE id = ?", args: [role, user.id] });
  }

  return json({ user: publicUser({ ...user, role }) }, 200, {
    "set-cookie": await sessionCookie(request, env, user),
  });
});
