// Panel de productos: alta, edición y eliminación del catálogo.
import { api } from "../shared/api.js";
import { $, CATEGORIES, categoryIcon, categoryLabel, escapeHtml, formatCOP, toast, withBusy } from "../shared/utils.js";

let products = [];

const rowTemplate = (p) => `
  <tr data-id="${p.id}">
    <td><div class="thumb">${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy" />` : categoryIcon(p.category)}</div></td>
    <td><strong>${escapeHtml(p.name)}</strong></td>
    <td>${categoryLabel(p.category)}</td>
    <td>${formatCOP(p.price)}</td>
    <td>${p.stock}</td>
    <td><div class="row-actions">
      <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
      <button class="btn btn-danger btn-sm" data-action="delete">Eliminar</button>
    </div></td>
  </tr>`;

function render() {
  $("#productsBody").innerHTML = products.length
    ? products.map(rowTemplate).join("")
    : `<tr><td colspan="6" class="empty-row">No hay productos en el catálogo.</td></tr>`;
}

function resetForm() {
  const form = $("#productForm");
  form.reset();
  form.elements.id.value = "";
  $("#productFormTitle").textContent = "Agregar producto";
  $("#productCancel").hidden = true;
  $("#productError").textContent = "";
}

function fillForm(product) {
  const form = $("#productForm");
  Object.entries({ id: product.id, name: product.name, category: product.category, price: product.price, stock: product.stock, imageUrl: product.imageUrl, description: product.description })
    .forEach(([key, value]) => (form.elements[key].value = value));
  $("#productFormTitle").textContent = `Editando: ${product.name}`;
  $("#productCancel").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function onSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const { id, ...data } = Object.fromEntries(new FormData(form));
  try {
    await withBusy($("#productSubmit"), () => (id ? api.put(`/productos/${id}`, data) : api.post("/productos", data)));
    toast(id ? "Producto actualizado" : "Producto agregado", "success");
    resetForm();
    await load();
  } catch (error) {
    $("#productError").textContent = error.message;
  }
}

async function onTableClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = Number(button.closest("tr").dataset.id);
  const product = products.find((p) => p.id === id);
  if (button.dataset.action === "edit") return fillForm(product);
  if (!confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
  try {
    await api.delete(`/productos/${id}`);
    toast("Producto eliminado", "success");
    await load();
  } catch (error) {
    toast(error.message, "error");
  }
}

export async function load() {
  products = (await api.get("/productos")).products;
  render();
}

export function init() {
  $("#pCategory").innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
  $("#productForm").addEventListener("submit", onSubmit);
  $("#productCancel").addEventListener("click", resetForm);
  $("#productsBody").addEventListener("click", onTableClick);
}
