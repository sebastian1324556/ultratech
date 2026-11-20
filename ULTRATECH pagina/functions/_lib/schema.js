// Esquema de la base de datos (Turso/libSQL), contenido por defecto y datos demo.

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    nequi_transaction_id TEXT,
    nequi_phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    project_type TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id)`,
];

/** Textos/banners editables desde Admin. Las claves de este objeto son las únicas permitidas. */
export const DEFAULT_CONTENT = {
  brandName: "ULTRATECH",
  promoBar: "⚡ Envíos a toda Colombia · Paga fácil con Nequi",
  heroBadge: "Tecnología de última generación",
  heroTitle: "Potencia tu mundo con tecnología ULTRA",
  heroSubtitle:
    "Componentes de PC, laptops, celulares y accesorios con los mejores precios y garantía real.",
  heroCta: "Explorar catálogo",
  heroImage: "",
  productsTitle: "Catálogo ULTRATECH",
  webTitle: "¿Necesitas una página web a tu medida?",
  webText:
    "Diseñamos sitios web y tiendas online personalizadas, rápidas y listas para vender. Cuéntanos tu idea y te enviamos una cotización.",
  contactWhatsapp: "573000000000",
  footerText: "© ULTRATECH. Todos los derechos reservados.",
};

export const DEMO_PRODUCTS = [
  ["NVIDIA GeForce RTX 4070 12GB", "Tarjeta gráfica GDDR6X con DLSS 3 y Ray Tracing para gaming 1440p.", "componentes", 2799000, 8],
  ["AMD Ryzen 7 7800X3D", "Procesador de 8 núcleos con tecnología 3D V-Cache, socket AM5.", "componentes", 1699000, 12],
  ["SSD NVMe 1TB Gen4", "Unidad de estado sólido con lecturas de hasta 7000 MB/s.", "componentes", 369000, 30],
  ["Laptop Gamer ASUS TUF 15", "Core i7, 16GB RAM, RTX 4060, pantalla 144Hz.", "laptops", 5199000, 5],
  ["MacBook Air M3 13\"", "Chip Apple M3, 8GB RAM, 256GB SSD. Ultraligera.", "laptops", 5499000, 6],
  ["Smartphone Galaxy S24 256GB", "Pantalla AMOLED 120Hz, cámara de 50MP y IA integrada.", "celulares", 3399000, 10],
  ["Xiaomi Redmi Note 13 Pro", "Cámara 200MP, carga rápida de 67W, 256GB.", "celulares", 1199000, 20],
  ["Teclado Mecánico RGB 75%", "Switches rojos hot-swap, retroiluminación RGB, conexión USB-C.", "accesorios", 259000, 25],
  ["Mouse Gamer Inalámbrico 26K DPI", "Sensor óptico de alta precisión, 70 horas de batería.", "accesorios", 189000, 40],
  ["Audífonos Bluetooth ANC", "Cancelación activa de ruido y 40 horas de autonomía.", "accesorios", 329000, 18],
];
