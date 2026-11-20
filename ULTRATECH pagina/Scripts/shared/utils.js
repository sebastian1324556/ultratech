// Utilidades de interfaz compartidas por la tienda y el panel admin.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const CATEGORIES = [
  { id: "componentes", label: "Componentes", icon: "🖥️" },
  { id: "laptops", label: "Laptops", icon: "💻" },
  { id: "celulares", label: "Celulares", icon: "📱" },
  { id: "accesorios", label: "Accesorios", icon: "🎧" },
];
export const ORDER_STATUSES = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];

export const categoryIcon = (id) => CATEGORIES.find((c) => c.id === id)?.icon ?? "📦";
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

const copFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const formatCOP = (value) => copFormatter.format(value);

export const formatDate = (iso) =>
  new Date(`${iso.replace(" ", "T")}Z`).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let toastStack;
export function toast(message, type = "info") {
  toastStack ??= Object.assign(document.body.appendChild(document.createElement("div")), { className: "toast-stack" });
  const el = Object.assign(document.createElement("div"), { className: `toast ${type}`, textContent: message });
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/** Deshabilita un botón mientras se ejecuta una acción asíncrona. */
export async function withBusy(button, action) {
  button.disabled = true;
  try {
    return await action();
  } finally {
    button.disabled = false;
  }
}
