// GET /api/productos[?category=laptops] — catálogo público.
// POST /api/productos — crea un producto (solo admin).
import { getDb, all, first } from "../../_lib/db.js";
import { handle, json, readJson } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { CATEGORIES, parseProduct } from "../../_lib/validate.js";

const COLUMNS = "id, name, description, category, price, stock, image_url AS imageUrl";

export const onRequestGet = handle(async ({ request, env }) => {
  const db = await getDb(env);
  const category = new URL(request.url).searchParams.get("category");
  const products =
    category && CATEGORIES.includes(category)
      ? await all(db, `SELECT ${COLUMNS} FROM products WHERE category = ? ORDER BY id DESC`, [category])
      : await all(db, `SELECT ${COLUMNS} FROM products ORDER BY id DESC`);
  return json({ products });
});

export const onRequestPost = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  const p = parseProduct(await readJson(context.request));
  const result = await db.execute({
    sql: "INSERT INTO products (name, description, category, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)",
    args: [p.name, p.description, p.category, p.price, p.stock, p.imageUrl],
  });
  const product = await first(db, `SELECT ${COLUMNS} FROM products WHERE id = ?`, [Number(result.lastInsertRowid)]);
  return json({ product }, 201);
});
