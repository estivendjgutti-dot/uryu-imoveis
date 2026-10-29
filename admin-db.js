import { sb, setAccessToken, fromRow } from "./data.js";
import { validateProperty, statuses } from "./validation.js";
import { watermarkPhoto } from "./photos.js";

let session = null;

function useSession(data) {
  session = {
    access: data.access_token,
    refresh: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  setAccessToken(session.access);
}

async function fresh() {
  if (!session) throw new Error("Entre novamente no painel.");
  if (session.expiresAt - Date.now() > 60000) return;
  const data = await sb("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: session.refresh }),
  });
  useSession(data);
}

export async function signIn(email, password) {
  setAccessToken("");
  const data = await sb("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: String(email || "").trim().toLowerCase(), password }),
  });
  useSession(data);
  const admins = await sb("/rest/v1/admins?select=user_id");
  if (!admins.length) {
    signOut();
    throw new Error("Este usuário não tem acesso ao painel.");
  }
}

export function signOut() {
  session = null;
  setAccessToken("");
}

export async function listAll() {
  await fresh();
  const rows = await sb("/rest/v1/properties?select=*&order=updated_at.desc");
  return rows.map(fromRow);
}

export async function saveProperty(body, id) {
  await fresh();
  const property = validateProperty(body);
  const notes = typeof body.private_notes === "string" ? body.private_notes : "";
  if (notes.length > 10000) throw new Error("Notas internas muito longas.");
  const row = { codigo: property.codigo, status: property.status, payload: property, private_notes: notes };
  const rows = await sb(
    "/rest/v1/properties" + (id ? `?id=eq.${id}` : ""),
    {
      method: id ? "PATCH" : "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    },
  );
  if (!rows.length) throw new Error("Imóvel não encontrado.");
  return fromRow(rows[0]);
}

export async function setStatus(property, status) {
  await fresh();
  if (!statuses.includes(status)) throw new Error("Estado inválido.");
  const { id, codigo, created_at, updated_at, private_notes, ...payload } = property;
  validateProperty({ ...payload, codigo, status });
  await sb(`/rest/v1/properties?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, payload: { ...payload, codigo, status } }),
  });
}

export async function uploadPhoto(file) {
  await fresh();
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(`${file.name}: envie JPG, PNG ou WebP.`);
  if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name}: limite de 12 MB.`);
  const blob = await watermarkPhoto(file);
  const name = crypto.randomUUID() + (blob.type === "image/webp" ? ".webp" : ".jpg");
  await sb("/storage/v1/object/fotos/" + name, {
    method: "POST",
    headers: { "Content-Type": blob.type, "x-upsert": "false", "Cache-Control": "31536000" },
    body: blob,
  });
  return name;
}
