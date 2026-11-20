// PUT /api/productos/:id — edita un producto (solo admin).
// DELETE /api/productos/:id — elimina un producto del catálogo (solo admin).
import { getDb, first } from "../../_lib/db.js";
import { HttpError, handle, idParam, json, readJson } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { parseProduct } from "../../_lib/validate.js";

export const onRequestPut = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  const id = idParam(context.params);
  const p = parseProduct(await readJson(context.request));
  const result = await db.execute({
    sql: "UPDATE products SET name = ?, description = ?, category = ?, price = ?, stock = ?, image_url = ? WHERE id = ?",
    args: [p.name, p.description, p.category, p.price, p.stock, p.imageUrl, id],
  });
  if (result.rowsAffected === 0) throw new HttpError(404, "Producto no encontrado");
  const product = await first(
    db,
    "SELECT id, name, description, category, price, stock, image_url AS imageUrl FROM products WHERE id = ?",
    [id],
  );
  return json({ product });
});

export const onRequestDelete = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  const result = await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [idParam(context.params)] });
  if (result.rowsAffected === 0) throw new HttpError(404, "Producto no encontrado");
  return json({ ok: true });
});
