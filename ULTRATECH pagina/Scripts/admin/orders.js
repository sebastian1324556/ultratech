// Panel de pedidos: listado y gestión del estado.
import { api } from "../shared/api.js";
import { $, ORDER_STATUSES, escapeHtml, formatCOP, formatDate, toast } from "../shared/utils.js";

let orders = [];

const rowTemplate = (o) => `
  <tr data-id="${o.id}">
    <td>#${o.id}</td>
    <td><strong>${escapeHtml(o.customer_name)}</strong><br />
      <span class="order-items">${escapeHtml(o.customer_email)} · ${escapeHtml(o.customer_phone)}<br />${escapeHtml(o.address)}</span></td>
    <td class="order-items">${o.items.map((i) => `${i.quantity} × ${escapeHtml(i.name)}`).join("<br />")}${o.notes ? `<br /><em>“${escapeHtml(o.notes)}”</em>` : ""}</td>
    <td>${formatCOP(o.total)}</td>
    <td>${formatDate(o.created_at)}</td>
    <td>
      <select class="status-select" aria-label="Estado del pedido #${o.id}" ${o.status === "cancelado" ? "disabled" : ""}>
        ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </td>
  </tr>`;

function renderStats() {
  const paid = orders.filter((o) => ["pagado", "enviado", "entregado"].includes(o.status));
  const stats = [
    ["Pedidos", orders.length],
    ["Pendientes", orders.filter((o) => o.status === "pendiente").length],
    ["Por enviar", orders.filter((o) => o.status === "pagado").length],
    ["Ventas cobradas", formatCOP(paid.reduce((sum, o) => sum + o.total, 0))],
  ];
  $("#orderStats").innerHTML = stats.map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
}

function render() {
  renderStats();
  $("#ordersBody").innerHTML = orders.length
    ? orders.map(rowTemplate).join("")
    : `<tr><td colspan="6" class="empty-row">Aún no hay pedidos.</td></tr>`;
}

async function onStatusChange(event) {
  const select = event.target.closest(".status-select");
  if (!select) return;
  const id = Number(select.closest("tr").dataset.id);
  try {
    await api.patch(`/pedidos/${id}`, { status: select.value });
    toast(`Pedido #${id} actualizado a "${select.value}"`, "success");
  } catch (error) {
    toast(error.message, "error");
  }
  await load();
}

export async function load() {
  orders = (await api.get("/pedidos")).orders;
  render();
}

export function init() {
  $("#ordersBody").addEventListener("change", onStatusChange);
}
