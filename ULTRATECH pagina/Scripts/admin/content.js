// Panel de contenido: edición de textos y banners de la tienda.
import { api } from "../shared/api.js";
import { $, escapeHtml, toast, withBusy } from "../shared/utils.js";

const FIELDS = [
  { key: "brandName", label: "Nombre de la marca" },
  { key: "promoBar", label: "Barra promocional superior" },
  { key: "heroBadge", label: "Etiqueta del banner principal" },
  { key: "heroTitle", label: "Título del banner principal" },
  { key: "heroSubtitle", label: "Subtítulo del banner", multiline: true },
  { key: "heroCta", label: "Texto del botón principal" },
  { key: "heroImage", label: "Imagen de fondo del banner (URL)" },
  { key: "productsTitle", label: "Título del catálogo" },
  { key: "webTitle", label: "Título de la sección de diseño web" },
  { key: "webText", label: "Texto de la sección de diseño web", multiline: true },
  { key: "contactWhatsapp", label: "WhatsApp (con indicativo, ej. 573001234567)" },
  { key: "footerText", label: "Texto del pie de página" },
];

const fieldTemplate = (f, value) => `
  <div class="field">
    <label for="c-${f.key}">${f.label}</label>
    ${f.multiline
      ? `<textarea id="c-${f.key}" name="${f.key}" maxlength="600">${escapeHtml(value)}</textarea>`
      : `<input id="c-${f.key}" name="${f.key}" maxlength="600" value="${escapeHtml(value)}" />`}
  </div>`;

export async function load() {
  const { content } = await api.get("/contenido");
  $("#contentFields").innerHTML = FIELDS.map((f) => fieldTemplate(f, content[f.key] ?? "")).join("");
}

export function init() {
  $("#contentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#contentError").textContent = "";
    try {
      await withBusy($("button[type=submit]", event.currentTarget), () =>
        api.put("/contenido", Object.fromEntries(new FormData(event.currentTarget))),
      );
      toast("Contenido actualizado. Ya es visible en la tienda.", "success");
    } catch (error) {
      $("#contentError").textContent = error.message;
    }
  });
}
