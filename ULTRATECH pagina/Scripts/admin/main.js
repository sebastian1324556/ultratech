// Punto de entrada del panel: protección por rol, navegación entre paneles y carga perezosa.
import { $, $$, toast, withBusy } from "../shared/utils.js";
import { isAdmin, login, loadSession, logout, onSessionChange } from "../shared/session.js";
import * as products from "./products.js";
import * as orders from "./orders.js";
import * as users from "./users.js";
import * as content from "./content.js";
import * as quotes from "./quotes.js";

const panels = { products, orders, users, content, quotes };
const loaded = new Set();

async function showPanel(name) {
  $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.panel === name));
  $$(".panel").forEach((p) => (p.hidden = p.id !== `panel-${name}`));
  $("#sidebar").classList.remove("open");
  try {
    await panels[name].load();
    loaded.add(name);
  } catch (error) {
    toast(error.message, "error");
  }
}

function renderGate(user) {
  const allowed = isAdmin();
  $("#adminLogin").hidden = allowed;
  $("#adminApp").hidden = !allowed;
  if (user && !allowed) $("#adminLoginError").textContent = "Esta cuenta no tiene permisos de administrador.";
  if (allowed) {
    $("#adminWho").textContent = user.email;
    if (!loaded.size) showPanel("products");
  } else {
    loaded.clear();
  }
}

function bindEvents() {
  $("#adminLoginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorEl = $("#adminLoginError");
    errorEl.textContent = "";
    try {
      await withBusy($("button[type=submit]", event.currentTarget), () =>
        login(Object.fromEntries(new FormData(event.currentTarget))),
      );
    } catch (error) {
      errorEl.textContent = error.message;
    }
  });
  $$(".nav-btn").forEach((b) => b.addEventListener("click", () => showPanel(b.dataset.panel)));
  $("#adminLogout").addEventListener("click", logout);
  $("#sidebarToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
}

products.init();
orders.init();
content.init();
bindEvents();
await loadSession();
onSessionChange(renderGate);
