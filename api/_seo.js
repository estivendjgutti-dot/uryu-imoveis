// Pure helpers behind /imovel and /sitemap.xml: they build the per-listing <head> that crawlers
// (Google, WhatsApp, Facebook) read without running the page's JavaScript.
export const SITE = "https://uryuimoveis.com.br";
const categoryNames = {
  apartamento: "Apartamento",
  casa: "Casa",
  comercial: "Imóvel comercial",
  terreno: "Terreno",
  studio: "Studio",
  kitnet: "Kitnet",
  cobertura: "Cobertura",
  sobrado: "Sobrado",
  casa_condominio: "Casa em condomínio",
  sala_comercial: "Sala comercial",
  ponto_comercial: "Ponto comercial",
  galpao: "Galpão",
  chacara: "Chácara",
};
const schemaTypes = {
  apartamento: "Apartment",
  studio: "Apartment",
  kitnet: "Apartment",
  cobertura: "Apartment",
  casa: "SingleFamilyResidence",
  sobrado: "SingleFamilyResidence",
  casa_condominio: "SingleFamilyResidence",
};
const photoRe = /^[a-f0-9-]{36}\.(webp|jpg)$/;

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clip = (s, max) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
};
const brl = (n) => "R$ " + new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number(n));

export const propertyUrl = (id) => `${SITE}/imovel?id=${encodeURIComponent(id)}`;
export const photoSrc = (base, name) => (photoRe.test(name || "") ? `${base}/storage/v1/object/public/fotos/${name}` : "");

export function propertyMeta(p, base) {
  const venda = p.negociacao === "venda";
  const tipo = categoryNames[p.categoria] || "Imóvel";
  const where = `${p.bairro}, ${p.cidade}/${p.estado}`;
  const specs = [
    `${p.tamanho} m²`,
    p.quartos ? `${p.quartos} ${p.quartos === 1 ? "quarto" : "quartos"}` : "",
    p.vagas ? `${p.vagas} ${p.vagas === 1 ? "vaga" : "vagas"}` : "",
  ].filter(Boolean);
  const price = brl(p.preco) + (venda ? "" : "/mês");
  const lead = `${tipo} ${venda ? "à venda" : "para alugar"} em ${where}. ${specs.join(" · ")}. ${price}.`;
  const description = clip(`${lead} ${p.descricao || "Fale com a Uryu e agende uma visita."}`, 158);
  const title = clip(`${p.titulo} | ${p.bairro}, ${p.cidade}`, 52) + " | Uryu";
  const images = (p.fotos || []).map((f) => photoSrc(base, f)).filter(Boolean);
  return { tipo, where, specs, price, description, title, images, url: propertyUrl(p.id), venda };
}

export function propertyJsonLd(p, base) {
  const m = propertyMeta(p, base);
  const about = {
    "@type": schemaTypes[p.categoria] || "Residence",
    name: p.titulo,
    address: { "@type": "PostalAddress", addressLocality: p.cidade, addressRegion: p.estado, addressCountry: "BR" },
    floorSize: { "@type": "QuantitativeValue", value: p.tamanho, unitCode: "MTK" },
  };
  if (p.quartos) about.numberOfBedrooms = p.quartos;
  if (p.banheiros) about.numberOfBathroomsTotal = p.banheiros;
  if (p.caracteristicas?.length)
    about.amenityFeature = p.caracteristicas.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true }));
  const offer = {
    "@type": "Offer",
    priceCurrency: "BRL",
    price: p.preco,
    availability: "https://schema.org/InStock",
    url: m.url,
    seller: { "@type": "RealEstateAgent", name: "Uryu Imóveis", url: SITE },
  };
  if (!m.venda)
    offer.priceSpecification = { "@type": "UnitPriceSpecification", price: p.preco, priceCurrency: "BRL", unitText: "MONTH" };
  const listing = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    url: m.url,
    description: m.description,
    datePosted: p.created_at,
    dateModified: p.updated_at,
    about,
    offers: offer,
  };
  if (m.images.length) listing.image = m.images;
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Uryu Imóveis", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: m.venda ? "Comprar" : "Alugar", item: SITE + "/#catalogo" },
      { "@type": "ListItem", position: 3, name: p.titulo, item: m.url },
    ],
  };
  return [listing, crumbs];
}

const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

const lf = (s) => s.replace(/\r\n/g, "\n");

export function renderPropertyPage(template, p, base) {
  const m = propertyMeta(p, base);
  const robots = p.demonstrativo ? '    <meta name="robots" content="noindex, follow" />\n' : "";
  const image = m.images[0] || SITE + "/og-image.jpg";
  const head =
    `    <title>${escapeHtml(m.title)}</title>\n` +
    `    <meta name="description" content="${escapeHtml(m.description)}" />\n` +
    robots +
    `    <link rel="canonical" href="${escapeHtml(m.url)}" />\n` +
    `    <meta property="og:type" content="website" />\n` +
    `    <meta property="og:site_name" content="Uryu Imóveis" />\n` +
    `    <meta property="og:locale" content="pt_BR" />\n` +
    `    <meta property="og:title" content="${escapeHtml(p.titulo)} · ${escapeHtml(m.price)}" />\n` +
    `    <meta property="og:description" content="${escapeHtml(m.description)}" />\n` +
    `    <meta property="og:url" content="${escapeHtml(m.url)}" />\n` +
    `    <meta property="og:image" content="${escapeHtml(image)}" />\n` +
    `    <meta name="twitter:card" content="summary_large_image" />\n` +
    propertyJsonLd(p, base)
      .map((o) => `    <script type="application/ld+json">${json(o)}</script>\n`)
      .join("");
  return lf(template)
    .replace(/\s*<title>[\s\S]*?<\/title>\s*<meta\s+name="description"[\s\S]*?\/>\n/, "\n" + head)
    .replace('    <script src="imoveis.js"></script>\n', "");
}

export function renderNotFound(template) {
  return lf(template)
    .replace("<head>", '<head>\n    <meta name="robots" content="noindex, nofollow" />')
    .replace('    <script src="imoveis.js"></script>\n', "");
}

export function sitemapXml(properties) {
  const urls = [
    `  <url><loc>${SITE}/</loc></url>`,
    ...properties
      .filter((p) => !p.demonstrativo)
      .map((p) => `  <url><loc>${escapeHtml(propertyUrl(p.id))}</loc><lastmod>${String(p.updated_at).slice(0, 10)}</lastmod></url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
