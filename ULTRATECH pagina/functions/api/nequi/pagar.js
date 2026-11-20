// POST /api/nequi/pagar — envía el cobro push al celular Nequi del cliente para un pedido pendiente.
// Credenciales y variables requeridas: ver functions/_lib/nequi.js y .dev.vars.example
import { getDb } from "../../_lib/db.js";
import { HttpError, handle, json, positiveInt, readJson } from "../../_lib/http.js";
import { requireUser } from "../../_lib/auth.js";
import { attachNequiPayment, getOrder } from "../../_lib/orders.js";
import { requestPushPayment } from "../../_lib/nequi.js";
import { parsePhone } from "../../_lib/validate.js";

export const onRequestPost = handle(async (context) => {
  const db = await getDb(context.env);
  const user = await requireUser(context, db);
  const body = await readJson(context.request);
  const order = await getOrder(db, positiveInt(body.orderId, "orderId", { min: 1 }));

  if (!order || order.user_id !== user.id) throw new HttpError(404, "Pedido no encontrado");
  if (order.status !== "pendiente") throw new HttpError(409, "Este pedido ya no admite pagos");

  const phone = parsePhone(body.phone, "celular Nequi");
  const transactionId = await requestPushPayment(context.env, {
    phone,
    amount: order.total,
    reference: `PEDIDO-${order.id}`,
  });
  await attachNequiPayment(db, order.id, transactionId, phone);

  return json({ orderId: order.id, transactionId, status: "pending" });
});
