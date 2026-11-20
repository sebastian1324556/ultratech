// Interfaz del carrito: cajón lateral, cantidades, eliminación y total automático.
import { $, categoryIcon, escapeHtml, formatCOP, toast } from "../shared/utils.js";
import * as cart from "./cart.js";

const drawer = $("#cartDrawer");
const overlay = $("#overlay");
const list = $("#cartItems");
const countBadge = $("#cartCount");
let lastCount = 0;

export function openCart() {
  drawer.classList.add("open");
  overlay.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

export function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

function itemTemplate(item) {
  const media = item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" />` : categoryIcon(item.category);
  return `
    <article class="cart-item" data-id="${item.id}">
      <div class="cart-thumb">${media}</div>
      <div>
        <h4>${escapeHtml(item.name)}</h4>
        <span class="muted">${formatCOP(item.price)}</span><br />
        <div class="qty">
          <button data-action="dec" aria-label="Quitar una unidad">−</button>
          <span>${item.quantity}</span>
          <button data-action="inc" aria-label="Agregar una unidad">+</button>
        </div>
      </div>
      <button class="cart-remove" data-action="remove" aria-label="Eliminar ${escapeHtml(item.name)}">🗑</button>
    </article>`;
}

function render(items) {
  list.innerHTML = items.length
    ? items.map(itemTemplate).join("")
    : `<p class="empty muted">Tu carrito está vacío.<br />¡Agrega algo de tecnología! ⚡</p>`;
  $("#cartTotal").textContent = formatCOP(cart.getTotal());
  $("#checkoutBtn").disabled = items.length === 0;
  $("#clearCart").hidden = items.length === 0;

  const count = cart.getCount();
  countBadge.textContent = count;
  if (count > lastCount) {
    countBadge.classList.add("bump");
    setTimeout(() => countBadge.classList.remove("bump"), 250);
  }
  lastCount = count;
}

function onListClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = Number(button.closest(".cart-item").dataset.id);
  const item = cart.getItems().find((i) => i.id === id);
  const actions = {
    inc: () => item.quantity >= item.stock ? toast("Alcanzaste el stock disponible", "error") : cart.setQuantity(id, item.quantity + 1),
    dec: () => cart.setQuantity(id, item.quantity - 1),
    remove: () => cart.removeItem(id),
  };
  actions[button.dataset.action]();
}

export function initCartUi() {
  $("#cartBtn").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());
  $("#clearCart").addEventListener("click", cart.clear);
  list.addEventListener("click", onListClick);
  cart.subscribe(render);
}
