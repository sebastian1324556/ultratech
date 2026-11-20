// Punto de entrada de la tienda: inicializa cada módulo.
import { $, $$ } from "../shared/utils.js";
import { loadSession } from "../shared/session.js";
import { initCartUi } from "./cart-ui.js";
import { initAuthUi } from "./auth-ui.js";
import { initCatalog } from "./catalog.js";
import { initCheckout } from "./checkout.js";
import { initContact } from "./contact.js";
import { initContent } from "./content.js";
import { openOrders } from "./orders-ui.js";

function initNavigation() {
  const nav = $("#nav");
  $("#menuToggle").addEventListener("click", () => nav.classList.toggle("open"));
  nav.addEventListener("click", (e) => e.target.closest("a") && nav.classList.remove("open"));
  // Cierre genérico de diálogos con [data-close]
  document.addEventListener("click", (e) => e.target.closest("[data-close]")?.closest("dialog")?.close());
  // Cerrar un diálogo al hacer clic fuera de su contenido
  $$("dialog").forEach((d) => d.addEventListener("click", (e) => e.target === d && d.close()));
}

function initRevealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && (entry.target.classList.add("visible"), observer.unobserve(entry.target))),
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => observer.observe(el));
}

initNavigation();
initRevealOnScroll();
initCartUi();
initAuthUi({ onOpenOrders: openOrders });
initCheckout();
initContact();
initContent();
initCatalog();
loadSession();
