// Lógica de pedidos: creación con control de stock, consulta y cambios de estado.
import { all, first } from "./db.js";
import { HttpError } from "./http.js";

async function withItems(db, orders) {
  if (orders.length === 0) return orders;
  const ids = orders.map((o) => o.id);
  const items = await all(
    db,
    `SELECT order_id, product_id, name, price, quantity FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  return orders.map((order) => ({ ...order, items: items.filter((i) => i.order_id === order.id) }));
}

export async function getOrder(db, id) {
  const order = await first(db, "SELECT * FROM orders WHERE id = ?", [id]);
  return order ? (await withItems(db, [order]))[0] : null;
}

export async function listOrders(db, { userId } = {}) {
  const orders = userId
    ? await all(db, "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [userId])
    : await all(db, "SELECT * FROM orders ORDER BY id DESC LIMIT 200");
  return withItems(db, orders);
}

/** Crea el pedido calculando precios en el servidor (nunca se confía en el total del cliente). */
export async function createOrder(db, user, { items, phone, address, notes }) {
  const ids = items.map((i) => i.productId);
  const products = await all(
    db,
    `SELECT id, name, price, stock FROM products WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const lines = items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product) throw new HttpError(404, "Uno de los productos ya no está disponible");
    if (product.stock < quantity) throw new HttpError(409, `Stock insuficiente para "${product.name}"`);
    total += product.price * quantity;
    return { ...product, quantity };
  });

  const result = await db.execute({
    sql: `INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, address, notes, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [user.id, user.name, user.email, phone, address, notes, total],
  });
  const orderId = Number(result.lastInsertRowid);

  await db.batch(
    [
      ...lines.map((l) => ({
        sql: "INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)",
        args: [orderId, l.id, l.name, l.price, l.quantity],
      })),
      ...lines.map((l) => ({
        sql: "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        args: [l.quantity, l.id, l.quantity],
      })),
    ],
    "write",
  );
  return getOrder(db, orderId);
}

/** Cambia el estado. Al cancelar se devuelve el stock reservado; un pedido cancelado no se reactiva. */
export async function updateOrderStatus(db, id, status) {
  const order = await getOrder(db, id);
  if (!order) throw new HttpError(404, "Pedido no encontrado");
  if (order.status === "cancelado" && status !== "cancelado") {
    throw new HttpError(409, "Un pedido cancelado no puede reactivarse");
  }
  const statements = [{ sql: "UPDATE orders SET status = ? WHERE id = ?", args: [status, id] }];
  if (status === "cancelado" && order.status !== "cancelado") {
    for (const item of order.items) {
      statements.push({
        sql: "UPDATE products SET stock = stock + ? WHERE id = ?",
        args: [item.quantity, item.product_id],
      });
    }
  }
  await db.batch(statements, "write");
  return getOrder(db, id);
}

export const attachNequiPayment = (db, id, transactionId, phone) =>
  db.execute({
    sql: "UPDATE orders SET nequi_transaction_id = ?, nequi_phone = ? WHERE id = ?",
    args: [transactionId, phone, id],
  });

export const markOrderPaid = (db, id) =>
  db.execute({ sql: "UPDATE orders SET status = 'pagado' WHERE id = ? AND status = 'pendiente'", args: [id] });
