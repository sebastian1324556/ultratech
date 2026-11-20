// Cliente de Nequi Conecta — Pagos con notificación Push (pago sin registro).
// Docs: https://conecta.nequi.com.co  ·  https://developer.nequi.com.co/documentacion/pagos-notificaciones-push
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ VARIABLES DE ENTORNO PARA HABILITAR LOS COBROS (Cloudflare Pages → Settings) │
// │                                                                             │
// │  NEQUI_CLIENT_ID       Client ID de tu app en Nequi Conecta                 │
// │  NEQUI_CLIENT_SECRET   Client Secret de tu app en Nequi Conecta             │
// │  NEQUI_API_KEY         API Key generada en Nequi Conecta (header x-api-key) │
// │  NEQUI_AUTH_URI        Sandbox:    https://oauth.sandbox.nequi.com/oauth2/token │
// │                        Producción: https://oauth.nequi.com/oauth2/token     │
// │  NEQUI_API_BASE_PATH   Sandbox:    https://api.sandbox.nequi.com/payments/v2 │
// │                        Producción: https://api.nequi.com/payments/v2        │
// │  NEQUI_COMMERCE_CODE   Código de comercio asignado (por defecto "NIT_1")    │
// │  NEQUI_MOCK            "true" = simula cobros SIN llamar a Nequi (solo pruebas) │
// └─────────────────────────────────────────────────────────────────────────────┘
import { HttpError } from "./http.js";

const CHANNEL = "PNP04-C001"; // canal de pagos Push
const STATUS = { PAID: "35", PENDING: "33" };
const MOCK_APPROVAL_MS = 8000;
const REQUIRED_VARS = ["NEQUI_CLIENT_ID", "NEQUI_CLIENT_SECRET", "NEQUI_API_KEY", "NEQUI_AUTH_URI", "NEQUI_API_BASE_PATH"];

let cachedToken = null; // { value, expiresAt }

export const isMock = (env) => String(env.NEQUI_MOCK).toLowerCase() === "true";

function assertConfigured(env) {
  const missing = REQUIRED_VARS.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new HttpError(
      503,
      `Los pagos con Nequi aún no están habilitados. Configura las variables: ${missing.join(", ")}`,
    );
  }
}

async function getAccessToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) return cachedToken.value;

  const url = new URL(env.NEQUI_AUTH_URI);
  url.searchParams.set("grant_type", "client_credentials");
  const credentials = btoa(`${env.NEQUI_CLIENT_ID}:${env.NEQUI_CLIENT_SECRET}`);
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!response.ok) throw new HttpError(502, "No fue posible autenticarse con Nequi");

  const data = await response.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

async function callNequi(env, endpoint, { clientId, operation, bodyKey, payload }) {
  const token = await getAccessToken(env);
  const body = {
    RequestMessage: {
      RequestHeader: {
        Channel: CHANNEL,
        RequestDate: new Date().toISOString(),
        MessageID: String(Date.now()).slice(-9),
        ClientID: clientId,
        Destination: {
          ServiceName: "PaymentsService",
          ServiceOperation: operation,
          ServiceRegion: "C001",
          ServiceVersion: "1.2.0",
        },
      },
      RequestBody: { any: { [bodyKey]: payload } },
    },
  };

  const response = await fetch(`${env.NEQUI_API_BASE_PATH}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.NEQUI_API_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  const header = data?.ResponseMessage?.ResponseHeader;
  if (!response.ok || header?.Status?.StatusCode !== "0") {
    console.error("[nequi] respuesta de error:", JSON.stringify(data));
    throw new HttpError(502, header?.Status?.StatusDesc || "Nequi rechazó la solicitud de pago");
  }
  return data.ResponseMessage.ResponseBody.any;
}

/** Envía la notificación push de cobro al celular Nequi del cliente. Devuelve el transactionId. */
export async function requestPushPayment(env, { phone, amount, reference }) {
  if (isMock(env)) return `MOCK-${Date.now()}`;
  assertConfigured(env);
  const result = await callNequi(env, "-services-paymentservice-unregisteredpayment", {
    clientId: phone,
    operation: "unregisteredPayment",
    bodyKey: "unregisteredPaymentRQ",
    payload: {
      phoneNumber: phone,
      code: env.NEQUI_COMMERCE_CODE || "NIT_1",
      value: String(amount),
      reference1: reference,
      reference2: "ULTRATECH",
      reference3: "Compra online",
    },
  });
  return result.unregisteredPaymentRS.transactionId;
}

/** Consulta el estado del cobro: "paid" | "pending" | "failed". */
export async function getPaymentStatus(env, { transactionId, phone }) {
  if (isMock(env)) {
    const createdAt = Number(String(transactionId).replace("MOCK-", ""));
    return Date.now() - createdAt >= MOCK_APPROVAL_MS ? "paid" : "pending";
  }
  assertConfigured(env);
  const result = await callNequi(env, "-services-paymentservice-getstatuspayment", {
    clientId: phone,
    operation: "getStatusPayment",
    bodyKey: "getStatusPaymentRQ",
    payload: { codeQR: transactionId },
  });
  const status = String(result.getStatusPaymentRS.status);
  if (status === STATUS.PAID) return "paid";
  if (status === STATUS.PENDING) return "pending";
  return "failed"; // rechazado, cancelado o expirado
}
