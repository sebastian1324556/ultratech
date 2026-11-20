// Aplica los textos y banners editables desde el panel Admin ([data-content="clave"]).
import { api } from "../shared/api.js";
import { $, $$, escapeHtml } from "../shared/utils.js";

export async function initContent() {
  try {
    const { content } = await api.get("/contenido");
    $$("[data-content]").forEach((el) => {
      const value = content[el.dataset.content];
      if (value) el.textContent = value;
    });
    if (content.heroImage) $("#heroBg").style.backgroundImage = `url("${escapeHtml(content.heroImage)}")`;
    if (content.contactWhatsapp) {
      const link = $("#whatsappLink");
      link.href = `https://wa.me/${content.contactWhatsapp.replace(/\D/g, "")}`;
      link.hidden = false;
    }
  } catch {
    /* Se conservan los textos por defecto del HTML */
  }
}
