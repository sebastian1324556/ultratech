// Conexión a Turso (libSQL). Se usa el cliente "web" (HTTP/WebSocket), compatible con Cloudflare Workers.
import { createClient } from "@libsql/client/web";
import { HttpError } from "./http.js";
import { SCHEMA_STATEMENTS, DEMO_PRODUCTS } from "./schema.js";

let client = null;
let ready = null;

async function initialize(db) {
  await db.batch(SCHEMA_STATEMENTS, "write");
  const { rows } = await db.execute("SELECT COUNT(*) AS total FROM products");
  if (Number(rows[0].total) === 0) {
    await db.batch(
      DEMO_PRODUCTS.map(([name, description, category, price, stock]) => ({
        sql: "INSERT INTO products (name, description, category, price, stock) VALUES (?, ?, ?, ?, ?)",
        args: [name, description, category, price, stock],
      })),
      "write",
    );
  }
}

/** Devuelve el cliente de Turso ya inicializado (tablas creadas y datos demo en la primera ejecución). */
export async function getDb(env) {
  if (!env.TURSO_DATABASE_URL) {
    throw new HttpError(500, "Falta configurar TURSO_DATABASE_URL");
  }
  client ??= createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  ready ??= initialize(client).catch((error) => {
    ready = null;
    throw error;
  });
  await ready;
  return client;
}

/** Ejecuta una consulta y devuelve un arreglo de objetos planos. */
export async function all(db, sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({ ...row }));
}

export async function first(db, sql, args = []) {
  return (await all(db, sql, args))[0] ?? null;
}
