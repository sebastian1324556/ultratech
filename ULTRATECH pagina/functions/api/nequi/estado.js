// GET /api/nequi/estado?orderId=1 — consulta a Nequi si el cobro fue aprobado y actualiza el pedido.
import { getDb } from "../../_lib/db.js";
import { HttpError, handle, json, positiveInt } from "../../_lib/http.js";
import { requireUser } from "../../_lib/auth.js";
import { getOrder, markOrderPaid } from "../../_lib/orders.js";
import { getPaymentStatus } from "../../_lib/nequi.js";

export const onRequestGet = handle(async (context) => {
  const db = await getDb(context.env);
  const user = await requireUser(context, db);
  const orderId = positiveInt(new URL(context.request.url).searchParams.get("orderId"), "orderId", { min: 1 });
  const order = await getOrder(db, orderId);

  if (!order || order.user_id !== user.id) throw new HttpError(404, "Pedido no encontrado");
  if (order.status === "pagado") return json({ orderId, status: "paid" });
  if (!order.nequi_transaction_id) throw new HttpError(409, "Este pedido no tiene un cobro Nequi iniciado");

  const status = await getPaymentStatus(context.env, {
    transactionId: order.nequi_transaction_id,
    phone: order.nequi_phone,
  });
  if (status === "paid") await markOrderPaid(db, orderId);
  return json({ orderId, status });
});
