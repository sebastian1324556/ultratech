// Checkout: crea el pedido, solicita el cobro push a Nequi y consulta el estado hasta su confirmación.
import { api } from "../shared/api.js";
import { getUser } from "../shared/session.js";
import { $, escapeHtml, formatCOP, toast, withBusy } from "../shared/utils.js";
import * as cart from "./cart.js";
import { closeCart } from "./cart-ui.js";
import { openAuth } from "./auth-ui.js";

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 45; // ~3 minutos

const dialog = $("#checkoutDialog");
const body = $("#checkoutBody");
let order = null; // pedido ya creado (permite reintentar el cobro sin duplicarlo)
let payPhone = ""; // celular Nequi usado en el último intento
let polling = false;

const header = (title) => `
  <div class="dialog-head"><h2>${title}</h2><button class="icon-btn" data-close aria-label="Cerrar">✕</button></div>`;

function renderForm(errorMessage = "") {
  const items = cart.getItems();
  const user = getUser();
  body.innerHTML = `
    ${header("Finalizar compra")}
    <span class="pay-brand">● Nequi</span>
    <div class="order-summary">
      ${items.map((i) => `<div><span>${i.quantity} × ${escapeHtml(i.name)}</span><span>${formatCOP(i.price * i.quantity)}</span></div>`).join("")}
      <div><strong>Total</strong><strong>${formatCOP(cart.getTotal())}</strong></div>
    </div>
    <form id="checkoutForm" novalidate>
      <div class="field"><label for="cPhone">Celular Nequi (recibirás la notificación de cobro)</label>
        <input id="cPhone" name="phone" inputmode="numeric" maxlength="10" placeholder="3001234567" value="${escapeHtml(user.phone)}" required /></div>
      <div class="field"><label for="cAddress">Dirección de entrega</label>
        <input id="cAddress" name="address" maxlength="300" required /></div>
      <div class="field"><label for="cNotes">Notas (opcional)</label>
        <input id="cNotes" name="notes" maxlength="500" /></div>
      <p class="form-error" role="alert">${escapeHtml(errorMessage)}</p>
      <button class="btn btn-primary btn-block" type="submit">Enviar cobro a mi Nequi</button>
    </form>`;
  $("#checkoutForm").addEventListener("submit", onSubmit);
}

function renderWaiting() {
  body.innerHTML = `
    ${header("Confirma en tu app Nequi")}
    <div class="pay-state">
      <div class="spinner"></div>
      <p>Enviamos una notificación de <strong>${formatCOP(order.total)}</strong> a tu celular Nequi.</p>
      <p class="muted">Abre la app Nequi y aprueba el pago. Esperando confirmación…</p>
    </div>`;
}

function renderResult({ icon, title, message, retry = false }) {
  body.innerHTML = `
    ${header(title)}
    <div class="pay-state">
      <div class="big">${icon}</div>
      <p>${escapeHtml(message)}</p>
      ${retry ? `<button class="btn btn-primary" id="retryPay">Reintentar cobro</button>` : `<button class="btn btn-primary" data-close>Listo</button>`}
    </div>`;
  if (retry) $("#retryPay").addEventListener("click", () => requestPayment());
}

async function pollStatus() {
  polling = true;
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS && polling; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    if (!polling) return;
    try {
      const { status } = await api.get(`/nequi/estado?orderId=${order.id}`);
      if (status === "paid") {
        polling = false;
        cart.clear();
        order = null;
        return renderResult({ icon: "✅", title: "¡Pago confirmado!", message: "Recibimos tu pago. Pronto prepararemos tu pedido." });
      }
      if (status === "failed") {
        polling = false;
        return renderResult({ icon: "⚠️", title: "Pago no completado", message: "El cobro fue rechazado o expiró.", retry: true });
      }
    } catch (error) {
      polling = false;
      return renderResult({ icon: "⚠️", title: "No pudimos verificar el pago", message: error.message, retry: true });
    }
  }
  if (polling) {
    polling = false;
    renderResult({ icon: "⏳", title: "Seguimos esperando", message: "Aún no recibimos la confirmación. Si ya pagaste, tu pedido se actualizará en 'Mis pedidos'." });
  }
}

async function requestPayment() {
  renderWaiting();
  try {
    await api.post("/nequi/pagar", { orderId: order.id, phone: payPhone });
    pollStatus();
  } catch (error) {
    renderResult({ icon: "⚠️", title: "No se pudo iniciar el cobro", message: error.message, retry: true });
  }
}

async function onSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
    await withBusy($("button[type=submit]", form), async () => {
      order = (await api.post("/pedidos", {
        items: cart.getItems().map((i) => ({ productId: i.id, quantity: i.quantity })),
        phone: data.phone,
        address: data.address,
        notes: data.notes,
      })).order;
    });
  } catch (error) {
    return renderForm(error.message);
  }
  payPhone = data.phone;
  requestPayment();
}

function startCheckout() {
  if (!getUser()) {
    closeCart();
    toast("Inicia sesión para completar tu compra");
    return openAuth("login");
  }
  closeCart();
  order = null;
  renderForm();
  dialog.showModal();
}

export function initCheckout() {
  $("#checkoutBtn").addEventListener("click", startCheckout);
  dialog.addEventListener("close", () => {
    polling = false;
  });
}
