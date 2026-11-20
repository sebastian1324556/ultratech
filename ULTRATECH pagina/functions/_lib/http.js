// Helpers HTTP: respuestas JSON, errores controlados y lectura/validación de entrada.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

/** Envuelve un handler para convertir excepciones en respuestas JSON consistentes. */
export const handle = (fn) => async (context) => {
  try {
    return await fn(context);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error("[api] error inesperado:", error);
    return json({ error: "Error interno del servidor" }, 500);
  }
};

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "El cuerpo de la petición debe ser JSON válido");
  }
}

/** Texto recortado; lanza 400 si es obligatorio y viene vacío. */
export function text(value, { label, max = 500, required = false } = {}) {
  const clean = String(value ?? "").trim().slice(0, max);
  if (required && !clean) throw new HttpError(400, `El campo "${label}" es obligatorio`);
  return clean;
}

export function positiveInt(value, label, { min = 0 } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) {
    throw new HttpError(400, `El campo "${label}" debe ser un entero mayor o igual a ${min}`);
  }
  return n;
}

export function idParam(params, name = "id") {
  const n = Number(params[name]);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, "Identificador inválido");
  return n;
}
