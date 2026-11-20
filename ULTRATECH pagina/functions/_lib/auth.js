// Autenticación: hash de contraseñas (PBKDF2), sesiones firmadas (HMAC-SHA256) en cookie HttpOnly y guardas de rol.
// Variables de entorno: AUTH_SECRET (obligatoria), ADMIN_EMAIL (el correo que obtiene el rol admin).
import { all, first } from "./db.js";
import { HttpError } from "./http.js";

const COOKIE_NAME = "ut_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 100000; // máximo permitido por Cloudflare Workers
const encoder = new TextEncoder();

const toB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
const toB64Url = (bytes) => toB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (str) => fromB64(str.replace(/-/g, "+").replace(/_/g, "/"));

async function pbkdf2(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
      key,
      256,
    ),
  );
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${toB64(salt)}$${toB64(await pbkdf2(password, salt))}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !salt || !hash) return false;
  const expected = fromB64(hash);
  const actual = await pbkdf2(password, fromB64(salt));
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= expected[i] ^ actual[i];
  return diff === 0;
}

async function hmacKey(env) {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 16) {
    throw new HttpError(500, "Falta configurar AUTH_SECRET (mínimo 16 caracteres)");
  }
  return crypto.subtle.importKey("raw", encoder.encode(env.AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function signToken(payload, env) {
  const body = toB64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(env), encoder.encode(body));
  return `${body}.${toB64Url(signature)}`;
}

async function verifyToken(token, env) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(env), fromB64Url(signature), encoder.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64Url(body)));
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function cookieAttributes(request, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function sessionCookie(request, env, user) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = await signToken({ sub: user.id, exp }, env);
  return `${COOKIE_NAME}=${token}; ${cookieAttributes(request, SESSION_SECONDS)}`;
}

export const clearedSessionCookie = (request) => `${COOKIE_NAME}=; ${cookieAttributes(request, 0)}`;

/** El correo configurado en ADMIN_EMAIL recibe el rol "admin"; el resto es "user". */
export function roleForEmail(env, email) {
  return env.ADMIN_EMAIL && env.ADMIN_EMAIL.trim().toLowerCase() === email ? "admin" : "user";
}

export const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });

/** Usuario autenticado (consultado en BD para respetar cambios de rol) o null. */
export async function currentUser({ request, env }, db) {
  const token = readCookie(request, COOKIE_NAME);
  const payload = token ? await verifyToken(token, env) : null;
  if (!payload) return null;
  return first(db, "SELECT id, name, email, phone, role FROM users WHERE id = ?", [payload.sub]);
}

export async function requireUser(context, db) {
  const user = await currentUser(context, db);
  if (!user) throw new HttpError(401, "Debes iniciar sesión");
  return user;
}

export async function requireAdmin(context, db) {
  const user = await requireUser(context, db);
  if (user.role !== "admin") throw new HttpError(403, "Acceso restringido a administradores");
  return user;
}

export const listUsers = (db) =>
  all(
    db,
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
     FROM users u ORDER BY u.id DESC`,
  );
