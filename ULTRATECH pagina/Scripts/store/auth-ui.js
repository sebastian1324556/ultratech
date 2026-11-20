// Interfaz de autenticación: modal de ingreso/registro y menú de usuario en la cabecera.
import { $, $$, escapeHtml, toast, withBusy } from "../shared/utils.js";
import { login, logout, onSessionChange, register } from "../shared/session.js";

const dialog = $("#authDialog");
const area = $("#authArea");
let openOrders = () => {};

export function openAuth(tab = "login") {
  switchTab(tab);
  dialog.showModal();
}

function switchTab(tab) {
  $$(".tab", dialog).forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  $("#loginForm").hidden = tab !== "login";
  $("#registerForm").hidden = tab !== "register";
  $("#authTitle").textContent = tab === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta";
}

function bindForm(form, action, successMessage) {
  const errorEl = $(".form-error", form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    const data = Object.fromEntries(new FormData(form));
    try {
      const user = await withBusy($("button[type=submit]", form), () => action(data));
      form.reset();
      dialog.close();
      toast(`${successMessage}, ${user.name.split(" ")[0]} 👋`, "success");
    } catch (error) {
      errorEl.textContent = error.message;
    }
  });
}

function renderArea(user) {
  if (!user) {
    area.innerHTML = `<button class="btn btn-ghost btn-sm" id="loginBtn">Ingresar</button>`;
    $("#loginBtn").addEventListener("click", () => openAuth("login"));
    return;
  }
  area.innerHTML = `
    <div class="user-menu">
      <button class="btn btn-ghost btn-sm" id="userBtn" aria-haspopup="true">👤 ${escapeHtml(user.name.split(" ")[0])}</button>
      <div class="user-dropdown" id="userDropdown" hidden>
        <div class="who">${escapeHtml(user.email)}</div>
        <button data-menu="orders">📦 Mis pedidos</button>
        ${user.role === "admin" ? `<a href="/Admin.html">🛠 Panel admin</a>` : ""}
        <button data-menu="logout">↩ Cerrar sesión</button>
      </div>
    </div>`;
  const dropdown = $("#userDropdown");
  $("#userBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });
  dropdown.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-menu]")?.dataset.menu;
    dropdown.hidden = true;
    if (action === "orders") openOrders();
    if (action === "logout") {
      await logout();
      toast("Sesión cerrada");
    }
  });
}

export function initAuthUi({ onOpenOrders }) {
  openOrders = onOpenOrders;
  $$(".tab", dialog).forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
  bindForm($("#loginForm"), login, "Hola");
  bindForm($("#registerForm"), register, "¡Cuenta creada! Bienvenido");
  document.addEventListener("click", () => {
    const dropdown = $("#userDropdown");
    if (dropdown) dropdown.hidden = true;
  });
  onSessionChange(renderArea);
}
