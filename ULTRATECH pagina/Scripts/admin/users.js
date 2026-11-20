// Panel de usuarios registrados (solo lectura).
import { api } from "../shared/api.js";
import { $, escapeHtml, formatDate } from "../shared/utils.js";

const rowTemplate = (u) => `
  <tr>
    <td>${u.id}</td>
    <td><strong>${escapeHtml(u.name)}</strong></td>
    <td>${escapeHtml(u.email)}</td>
    <td>${escapeHtml(u.phone)}</td>
    <td><span class="badge badge-${u.role}">${u.role}</span></td>
    <td>${u.orders_count}</td>
    <td>${formatDate(u.created_at)}</td>
  </tr>`;

export async function load() {
  const { users } = await api.get("/usuarios");
  $("#usersBody").innerHTML = users.length
    ? users.map(rowTemplate).join("")
    : `<tr><td colspan="7" class="empty-row">No hay usuarios registrados.</td></tr>`;
}
