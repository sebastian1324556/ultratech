// Formulario de contacto para cotizar páginas web.
import { api } from "../shared/api.js";
import { $, toast, withBusy } from "../shared/utils.js";

export function initContact() {
  const form = $("#contactForm");
  const errorEl = $("#contactError");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    try {
      await withBusy($("button[type=submit]", form), () => api.post("/cotizaciones", Object.fromEntries(new FormData(form))));
      form.reset();
      toast("¡Gracias! Recibimos tu solicitud y te contactaremos pronto.", "success");
    } catch (error) {
      errorEl.textContent = error.message;
    }
  });
}
