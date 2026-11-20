// GET /api/pedidos — pedidos del usuario (admin: todos).
// POST /api/pedidos — crea un pedido a partir del carrito (usuario autenticado).
import { getDb } from "../../_lib/db.js";
import { handle, json, readJson, text } from "../../_lib/http.js";
import { requireUser } from "../../_lib/auth.js";
import { createOrder, listOrders } from "../../_lib/orders.js";
import { parseOrderItems, parsePhone } from "../../_lib/validate.js";

export const onRequestGet = handle(async (context) => {
  const db = await getDb(context.env);
  const user = await requireUser(context, db);
  const orders = await listOrders(db, user.role === "admin" ? {} : { userId: user.id });
  return json({ orders });
});

export const onRequestPost = handle(async (context) => {
  const db = await getDb(context.env);
  const user = await requireUser(context, db);
  const body = await readJson(context.request);
  const order = await createOrder(db, user, {
    items: parseOrderItems(body.items),
    phone: parsePhone(body.phone),
    address: text(body.address, { label: "dirección", required: true, max: 300 }),
    notes: text(body.notes, { label: "notas", max: 500 }),
  });
  return json({ order }, 201);
});
