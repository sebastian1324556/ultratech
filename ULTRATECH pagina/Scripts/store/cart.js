// Estado del carrito (sin DOM). Persistido en localStorage y observable.
const STORAGE_KEY = "ultratech_cart_v1";
const MAX_QTY = 99;

let items = load();
const listeners = new Set();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function commit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}

export const subscribe = (fn) => {
  listeners.add(fn);
  fn(items);
};
export const getItems = () => items;
export const getCount = () => items.reduce((sum, i) => sum + i.quantity, 0);
export const getTotal = () => items.reduce((sum, i) => sum + i.price * i.quantity, 0);

/** Agrega un producto respetando el stock disponible. Devuelve false si no hay más unidades. */
export function addItem(product) {
  const existing = items.find((i) => i.id === product.id);
  const limit = Math.min(product.stock, MAX_QTY);
  if (existing) {
    if (existing.quantity >= limit) return false;
    existing.quantity += 1;
    existing.stock = product.stock;
  } else {
    if (limit < 1) return false;
    items = [...items, { id: product.id, name: product.name, price: product.price, category: product.category, imageUrl: product.imageUrl, stock: product.stock, quantity: 1 }];
  }
  commit();
  return true;
}

export function setQuantity(id, quantity) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  if (quantity < 1) return removeItem(id);
  item.quantity = Math.min(quantity, item.stock, MAX_QTY);
  commit();
}

export function removeItem(id) {
  items = items.filter((i) => i.id !== id);
  commit();
}

export function clear() {
  items = [];
  commit();
}

/** Sincroniza precio/stock con el catálogo vigente y elimina productos que ya no existen. */
export function syncWithCatalog(products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  items = items
    .filter((i) => byId.has(i.id) && byId.get(i.id).stock > 0)
    .map((i) => {
      const p = byId.get(i.id);
      return { ...i, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock, quantity: Math.min(i.quantity, p.stock) };
    });
  commit();
}
