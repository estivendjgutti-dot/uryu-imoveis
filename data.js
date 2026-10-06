import { label } from "./catalog-i18n.js";
const config = window.URYU_CONFIG || { demo: true, apiUrl: "" };
let token = "";
export const isDemo = !!config.demo;
export const apiBase = (config.apiUrl || "").replace(/\/$/, "");
export function setToken(value) {
  token = value || "";
}
export async function request(path, options = {}) {
  if (!apiBase) throw new Error("O banco ainda não foi conectado.");
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch(apiBase + "/api" + path, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      data.error || "Não foi possível concluir a operação.",
    );
    err.status = response.status;
    throw err;
  }
  return data;
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
  return (await request("/properties")).map(normalize);
}
export async function getProperty(id) {
  if (isDemo) return (await getProperties()).find((i) => String(i.id) === id);
  try {
    return normalize(await request("/properties/" + encodeURIComponent(id)));
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}
export function photoUrl(value) {
  if (/^https:\/\//.test(value || "")) return value;
  if (/^[a-f0-9-]{36}\.webp$/.test(value || ""))
    return apiBase + "/api/media/" + value;
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
