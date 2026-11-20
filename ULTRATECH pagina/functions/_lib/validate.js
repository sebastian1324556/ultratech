// Reglas de validación compartidas por los endpoints.
import { HttpError, positiveInt, text } from "./http.js";

export const CATEGORIES = ["componentes", "laptops", "celulares", "accesorios"];
export const ORDER_STATUSES = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\d{10}$/; // celular colombiano (10 dígitos)

export function parseProduct(body) {
  const category = text(body.category, { label: "categoría", required: true });
  if (!CATEGORIES.includes(category)) throw new HttpError(400, "Categoría inválida");
  const imageUrl = text(body.imageUrl, { label: "imagen", max: 1000 });
  if (imageUrl && !/^(https?:\/\/|\/)/.test(imageUrl)) throw new HttpError(400, "La imagen debe ser una URL válida");
  return {
    name: text(body.name, { label: "nombre", required: true, max: 120 }),
    description: text(body.description, { label: "descripción", max: 1000 }),
    category,
    price: positiveInt(body.price, "precio", { min: 1 }),
    stock: positiveInt(body.stock, "stock"),
    imageUrl,
  };
}

/** Normaliza los ítems del carrito, fusionando productos repetidos. */
export function parseOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, "El carrito está vacío");
  const merged = new Map();
  for (const item of items.slice(0, 50)) {
    const productId = positiveInt(item.productId, "productId", { min: 1 });
    const quantity = positiveInt(item.quantity, "cantidad", { min: 1 });
    merged.set(productId, Math.min((merged.get(productId) ?? 0) + quantity, 99));
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

export function parsePhone(value, label = "celular") {
  const phone = text(value, { label, required: true, max: 20 }).replace(/\D/g, "");
  if (!PHONE_RE.test(phone)) throw new HttpError(400, `El ${label} debe tener 10 dígitos`);
  return phone;
}

export function parseEmail(value) {
  const email = text(value, { label: "correo", required: true, max: 160 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Correo electrónico inválido");
  return email;
}
