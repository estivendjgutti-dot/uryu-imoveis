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

export async function activate(email, code, password) {
  const mail = String(email || "").trim().toLowerCase();
  setAccessToken("");
  let data = {};
  try {
    data = await sb("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email: mail, password }),
    });
  } catch (e) {
    if (!/já tem conta/.test(e.message)) throw e;
  }
  if (!data.access_token)
    data = await sb("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: mail, password }),
    });
  useSession(data);
  try {
    await sb("/rest/v1/rpc/redeem_invite", {
      method: "POST",
      body: JSON.stringify({ p_code: String(code || "").trim() }),
    });
  } catch (e) {
    signOut();
    throw e;
  }
}

export async function listAccess() {
  await fresh();
  const [admins, invites] = await Promise.all([
    sb("/rest/v1/admins?select=user_id,email,created_at&order=created_at"),
    sb("/rest/v1/admin_invites?select=email,created_at,expires_at&order=created_at"),
  ]);
  return { admins, invites };
}

export async function inviteAdmin(email) {
  await fresh();
  return sb("/rest/v1/rpc/invite_admin", {
    method: "POST",
    body: JSON.stringify({ p_email: String(email || "").trim().toLowerCase() }),
  });
}

export async function removeAdmin(userId) {
  await fresh();
  await sb(`/rest/v1/admins?user_id=eq.${userId}`, { method: "DELETE" });
}

export async function cancelInvite(email) {
  await fresh();
  await sb(`/rest/v1/admin_invites?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" });
}

export function currentUserId() {
  try {
    return JSON.parse(atob(session.access.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub;
  } catch {
    return "";
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
