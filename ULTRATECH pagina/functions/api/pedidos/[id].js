// PATCH /api/pedidos/:id — actualiza el estado de un pedido (solo admin).
import { getDb } from "../../_lib/db.js";
import { HttpError, handle, idParam, json, readJson } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/auth.js";
import { updateOrderStatus } from "../../_lib/orders.js";
import { ORDER_STATUSES } from "../../_lib/validate.js";

export const onRequestPatch = handle(async (context) => {
  const db = await getDb(context.env);
  await requireAdmin(context, db);
  const { status } = await readJson(context.request);
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, "Estado de pedido inválido");
  const order = await updateOrderStatus(db, idParam(context.params), status);
  return json({ order });
});
