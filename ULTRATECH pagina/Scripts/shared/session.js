// Estado de sesión del usuario (compartido por tienda y admin).
import { api } from "./api.js";

let user = null;
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn(user));

export const getUser = () => user;
export const isAdmin = () => user?.role === "admin";
export const onSessionChange = (fn) => {
  listeners.add(fn);
  fn(user);
};

export async function loadSession() {
  try {
    user = (await api.get("/usuarios/me")).user;
  } catch {
    user = null;
  }
  notify();
  return user;
}

export async function login(credentials) {
  user = (await api.post("/usuarios/login", credentials)).user;
  notify();
  return user;
}

export async function register(data) {
  user = (await api.post("/usuarios/registro", data)).user;
  notify();
  return user;
}

export async function logout() {
  await api.post("/usuarios/logout");
  user = null;
  notify();
}
