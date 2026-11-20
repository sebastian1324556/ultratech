// POST /api/usuarios/logout — cierra la sesión.
import { handle, json } from "../../_lib/http.js";
import { clearedSessionCookie } from "../../_lib/auth.js";

export const onRequestPost = handle(async ({ request }) =>
  json({ ok: true }, 200, { "set-cookie": clearedSessionCookie(request) }),
);
