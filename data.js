import { label } from "./catalog-i18n.js";
const config = window.URYU_CONFIG || { demo: true };
export const dbBase = (config.supabaseUrl || "").replace(/\/$/, "");
const anonKey = config.supabaseKey || "";
export const isDemo = !!config.demo || !dbBase;
let accessToken = "";
export function setAccessToken(value) {
  accessToken = value || "";
}
function friendlyError(data, status) {
  const text = [data.message, data.msg, data.error_description, data.error, data.details]
    .filter(Boolean).join(" ");
  if (data.code === "23505") return "Já existe um imóvel com esse código.";
  if (/publicar_exige/.test(text)) return "Para publicar, informe descrição e ao menos uma foto.";
  if (/invalid login|invalid_credentials/i.test(text)) return "E-mail ou senha inválidos.";
  if (/email not confirmed/i.test(text)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (/already registered|user_already_exists/i.test(text)) return "Este e-mail já tem conta. Use “Entrar no painel”.";
  if (/password/i.test(text) && /least|weak|short/i.test(text)) return "Senha fraca. Use ao menos 12 caracteres.";
  if (/email_invalido/.test(text)) return "E-mail inválido.";
  if (/codigo_invalido/.test(text)) return "Código de convite inválido ou vencido. Peça um novo código a quem convidou.";
  if (/ja_admin/.test(text)) return "Esta pessoa já tem acesso ao painel.";
  if (/sem_sessao/.test(text)) return "Entre novamente e tente de novo.";
  if (/rate limit|over_email_send/i.test(text)) return "Muitas tentativas. Aguarde alguns minutos.";
  if (status === 401 || /jwt/i.test(text)) return "Sua sessão expirou. Entre novamente no painel.";
  if (status === 403 || data.code === "42501") return "Este usuário não tem permissão para essa ação.";
  if (/payload too large|exceeded the maximum/i.test(text)) return "A foto excede o limite de 12 MB.";
  return "Não foi possível concluir a operação. Tente novamente.";
}
export async function sb(path, options = {}) {
  if (!dbBase) throw new Error("O banco ainda não foi conectado.");
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
    ...options.headers,
  };
  if (typeof options.body === "string" && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";
  const response = await fetch(dbBase + path, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(60000),
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    const err = new Error(friendlyError(data, response.status));
    err.status = response.status;
    throw err;
  }
  return data;
}
const publicColumns = "id,codigo,status,payload,created_at,updated_at";
export function fromRow(row) {
  const out = {
    ...row.payload,
    id: row.id,
    codigo: row.codigo,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (row.private_notes !== undefined) out.private_notes = row.private_notes;
  return out;
}
export function normalize(i) {
  return {
    ...i,
    preco: Number(i.preco),
    tamanho: Number(i.tamanho),
    condominio: Number(i.condominio || 0),
    iptu: Number(i.iptu || 0),
    fotos: i.fotos?.length ? i.fotos : i.img ? [i.img] : [],
    codigo: i.codigo || `URY-${String(i.id).padStart(4, "0")}`,
  };
}
export async function getProperties() {
  if (isDemo)
    return (window.IMOVEIS || []).map((i) =>
      normalize({
        ...i,
        status: "publicado",
        destaque: [1, 2, 3, 9, 10, 11].includes(i.id),
      }),
    );
  const rows = await sb(
    `/rest/v1/properties?select=${publicColumns}&status=eq.publicado&order=created_at.desc&limit=1000`,
  );
  return rows.map(fromRow).map(normalize);
}
export async function getProperty(id) {
  if (isDemo) return (await getProperties()).find((i) => String(i.id) === id);
  if (!/^[a-f0-9-]{36}$/i.test(id || "")) return null;
  const rows = await sb(
    `/rest/v1/properties?select=${publicColumns}&status=eq.publicado&id=eq.${id}`,
  );
  return rows.length ? normalize(fromRow(rows[0])) : null;
}
export function photoUrl(value) {
  if (/^https:\/\//.test(value || "")) return value;
  if (/^[a-f0-9-]{36}\.(webp|jpg)$/.test(value || ""))
    return dbBase + "/storage/v1/object/public/fotos/" + value;
  return "";
}
export function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
export function whatsapp(i) {
  return (
    "https://wa.me/5511970508331?text=" +
    encodeURIComponent(
      `Olá! Tenho interesse no imóvel ${i.codigo}: ${i.titulo}. ${location.href.split("?")[0].replace(/[^/]*$/, "")}imovel.html?id=${i.id}`,
    )
  );
}
export function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}
export function featuredCompare(a,b) {
  return Number(b.destaque)-Number(a.destaque) || (Number(a.ordem_destaque)||9999)-(Number(b.ordem_destaque)||9999);
}
export function propertyCard(i) {
  const card = el("article", "property-card");
  const link = el("a", "property-image");
  link.href = "imovel.html?id=" + encodeURIComponent(i.id);
  const url = photoUrl(i.fotos[0]);
  if (url) {
    const img = el("img");
    img.src = url;
    img.alt = i.titulo;
    img.loading = "lazy";
    img.decoding = "async";
    link.append(img);
  } else link.append(el("span", "photo-placeholder", "Imagem em preparação"));
  link.append(
    el(
      "span",
      "property-badge",
      i.negociacao === "venda"
        ? label("À venda", "For sale", "En venta")
        : label("Para alugar", "For rent", "En alquiler"),
    ),
  );
  const body = el("div", "property-body");
  if (i.demonstrativo)
    body.append(el("p", "demo-label", "DEMONSTRAÇÃO · Imagens geradas por IA"));
  body.append(
    el("p", "property-code", i.codigo),
    el("h3", "", i.titulo),
    el("p", "muted", `${i.bairro} · ${i.cidade}/${i.estado}`),
    el(
      "p",
      "property-specs",
      `${i.tamanho} m²${i.quartos ? ` · ${i.quartos} ${i.quartos === 1 ? "quarto" : "quartos"}` : ""}${i.vagas ? ` · ${i.vagas} ${i.vagas === 1 ? "vaga" : "vagas"}` : ""}`,
    ),
  );
  const bottom = el("div", "property-bottom");
  bottom.append(
    el(
      "strong",
      "",
      money(i.preco) +
        (i.negociacao === "aluguel" ? label(" /mês", " /month", " /mes") : ""),
    ),
  );
  const details = el(
    "a",
    "text-button",
    label("Ver imóvel ↗", "View property ↗", "Ver inmueble ↗"),
  );
  details.href = link.href;
  bottom.append(details);
  body.append(bottom);
  card.append(link, body);
  return card;
}
