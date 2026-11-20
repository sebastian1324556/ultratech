// Catálogo: carga de productos, filtros por categoría, búsqueda y botón "Agregar".
import { api } from "../shared/api.js";
import { $, CATEGORIES, categoryIcon, categoryLabel, debounce, escapeHtml, formatCOP, toast } from "../shared/utils.js";
import * as cart from "./cart.js";

const grid = $("#productGrid");
const state = { products: [], category: "all", query: "" };

function cardTemplate(product, index) {
  const media = product.imageUrl
    ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : categoryIcon(product.category);
  const soldOut = product.stock < 1;
  const lowStock = !soldOut && product.stock <= 5 ? `<span class="stock-low">¡Solo quedan ${product.stock}!</span>` : "";
  return `
    <article class="product-card" style="animation-delay:${Math.min(index, 12) * 50}ms">
      <div class="product-media">${media}</div>
      <div class="product-info">
        <span class="product-cat">${categoryLabel(product.category)}</span>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <p class="product-desc">${escapeHtml(product.description)}</p>
        ${lowStock}
        <div class="product-foot">
          <span class="price">${formatCOP(product.price)}</span>
          <button class="btn btn-primary btn-sm" data-add="${product.id}" ${soldOut ? "disabled" : ""}>
            ${soldOut ? "Agotado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>`;
}

function visibleProducts() {
  const query = state.query.toLowerCase();
  return state.products.filter(
    (p) =>
      (state.category === "all" || p.category === state.category) &&
      (!query || `${p.name} ${p.description}`.toLowerCase().includes(query)),
  );
}

function render() {
  const products = visibleProducts();
  grid.innerHTML = products.length
    ? products.map(cardTemplate).join("")
    : `<p class="empty">No encontramos productos con ese criterio. 🔍</p>`;
}

function renderChips() {
  const chips = [{ id: "all", label: "Todos" }, ...CATEGORIES.map((c) => ({ ...c, label: `${c.icon} ${c.label}` }))];
  $("#chips").innerHTML = chips
    .map((c) => `<button class="chip ${c.id === state.category ? "active" : ""}" data-category="${c.id}" role="tab">${c.label}</button>`)
    .join("");
}

export async function initCatalog() {
  renderChips();
  grid.innerHTML = Array.from({ length: 4 }, () => `<div class="skeleton"></div>`).join("");

  $("#chips").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    state.category = chip.dataset.category;
    renderChips();
    render();
  });
  $("#search").addEventListener("input", debounce((event) => {
    state.query = event.target.value.trim();
    render();
  }));
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    const product = state.products.find((p) => p.id === Number(button.dataset.add));
    if (cart.addItem(product)) toast(`${product.name} agregado al carrito`, "success");
    else toast("No hay más unidades disponibles de este producto", "error");
  });

  try {
    state.products = (await api.get("/productos")).products;
    cart.syncWithCatalog(state.products);
    render();
  } catch (error) {
    grid.innerHTML = `<p class="empty">No pudimos cargar el catálogo. ${escapeHtml(error.message)}</p>`;
  }
}
