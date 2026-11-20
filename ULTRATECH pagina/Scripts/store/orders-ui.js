// "Mis pedidos": historial de compras del usuario con su estado.
import { api } from "../shared/api.js";
import { $, escapeHtml, formatCOP, formatDate } from "../shared/utils.js";

const dialog = $("#ordersDialog");
const body = $("#ordersBody");

const orderTemplate = (order) => `
  <article class="my-order">
    <header>
      <strong>Pedido #${order.id}</strong>
      <span class="badge badge-${order.status}">${order.status}</span>
    </header>
    <div class="muted">${formatDate(order.created_at)}</div>
    <ul style="margin:0.6rem 0 0.6rem 1.1rem">
      ${order.items.map((i) => `<li>${i.quantity} × ${escapeHtml(i.name)}</li>`).join("")}
    </ul>
    <strong>${formatCOP(order.total)}</strong>
  </article>`;

export async function openOrders() {
  body.innerHTML = `<div class="spinner"></div>`;
  dialog.showModal();
  try {
    const { orders } = await api.get("/pedidos");
    body.innerHTML = orders.length ? orders.map(orderTemplate).join("") : `<p class="muted">Aún no tienes pedidos.</p>`;
  } catch (error) {
    body.innerHTML = `<p class="form-error">${escapeHtml(error.message)}</p>`;
  }
}
