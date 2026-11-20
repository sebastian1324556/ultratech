// Panel de cotizaciones web recibidas desde el formulario de contacto (solo lectura).
import { api } from "../shared/api.js";
import { $, escapeHtml, formatDate } from "../shared/utils.js";

const rowTemplate = (q) => `
  <tr>
    <td>${formatDate(q.created_at)}</td>
    <td><strong>${escapeHtml(q.name)}</strong><br /><span class="order-items">${escapeHtml(q.email)}${q.phone ? ` · ${escapeHtml(q.phone)}` : ""}</span></td>
    <td>${escapeHtml(q.project_type)}</td>
    <td class="quote-msg">${escapeHtml(q.message)}</td>
  </tr>`;

export async function load() {
  const { quotes } = await api.get("/cotizaciones");
  $("#quotesBody").innerHTML = quotes.length
    ? quotes.map(rowTemplate).join("")
    : `<tr><td colspan="4" class="empty-row">Aún no hay solicitudes.</td></tr>`;
}
