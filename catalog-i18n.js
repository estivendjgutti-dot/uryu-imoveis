// Preserve the prototype's language switch for the new catalogue sections.
const phrases = {
  "Encontre seu lugar": ["Find your place", "Encuentra tu lugar"],
  "Um endereço para": ["An address for", "Una dirección para"],
  "cada novo capítulo.": ["every new chapter.", "cada nuevo capítulo."],
  "Compare opções para comprar ou alugar e conte com orientação em cada etapa.":
    [
      "Compare properties to buy or rent with guidance at every step.",
      "Compara opciones para comprar o alquilar con orientación en cada etapa.",
    ],
  Quero: ["I want to", "Quiero"],
  "Comprar ou alugar": ["Buy or rent", "Comprar o alquilar"],
  Comprar: ["Buy", "Comprar"],
  Alugar: ["Rent", "Alquilar"],
  Cidade: ["City", "Ciudad"],
  "Preço máximo": ["Maximum price", "Precio máximo"],
  "Encontrar imóveis ↗": ["Find properties ↗", "Encontrar inmuebles ↗"],
  "Mais filtros": ["More filters", "Más filtros"],
  Tipo: ["Type", "Tipo"],
  Todos: ["All", "Todos"],
  Apartamento: ["Apartment", "Apartamento"],
  Casa: ["House", "Casa"],
  Comercial: ["Commercial", "Comercial"],
  Terreno: ["Land", "Terreno"],
  Bairro: ["Neighborhood", "Barrio"],
  "Quartos mínimos": ["Minimum bedrooms", "Dormitorios mínimos"],
  "Banheiros mínimos": ["Minimum bathrooms", "Baños mínimos"],
  "Vagas mínimas": ["Minimum parking spaces", "Plazas mínimas"],
  "Área mínima · m²": ["Minimum area · m²", "Superficie mínima · m²"],
  Fase: ["Stage", "Fase"],
  Todas: ["All", "Todas"],
  Pronto: ["Ready", "Listo"],
  "Em obras": ["Under construction", "En construcción"],
  "Na planta": ["Off-plan", "Sobre plano"],
  "Limpar filtros": ["Clear filters", "Limpiar filtros"],
  Ordenar: ["Sort", "Ordenar"],
  "Mais recentes": ["Most recent", "Más recientes"],
  "Menor preço": ["Lowest price", "Menor precio"],
  "Maior preço": ["Highest price", "Mayor precio"],
  "Maior área": ["Largest area", "Mayor superficie"],
  "Imóveis em destaque.": ["Featured properties.", "Inmuebles destacados."],
  "Ver imóveis à venda ↗": [
    "See properties for sale ↗",
    "Ver inmuebles en venta ↗",
  ],
  "Seu próximo lugar": ["Your next place", "Tu próximo lugar"],
  "para morar.": ["to call home.", "para vivir."],
  "Ver imóveis para alugar ↗": [
    "See rental properties ↗",
    "Ver inmuebles en alquiler ↗",
  ],
  "Vamos conversar": ["Let’s talk", "Hablemos"],
  "Conte o que você procura.": [
    "Tell us what you are looking for.",
    "Cuéntanos qué buscas.",
  ],
  "Fale com um consultor e receba opções de acordo com suas preferências.": [
    "Talk to an advisor for options that fit your preferences.",
    "Habla con un asesor para recibir opciones según tus preferencias.",
  ],
  "Conversar pelo WhatsApp ↗": [
    "Talk on WhatsApp ↗",
    "Hablar por WhatsApp ↗",
  ],
};
const nodes = [];
for (const root of document.querySelectorAll(
  "#catalogo,#comprar,#alugar,.contact-invite",
)) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode,
      key = node.textContent.trim();
    if (phrases[key]) nodes.push({ node, key });
  }
}
export function translateCatalog() {
  const lang = window.__lang || "pt";
  for (const { node, key } of nodes)
    node.textContent =
      lang === "pt" ? key : phrases[key][lang === "es" ? 1 : 0];
  const price = document.querySelector("[name=preco]");
  if (price)
    price.placeholder =
      lang === "pt"
        ? "Sem limite · R$"
        : lang === "es"
          ? "Sin límite · R$"
          : "No limit · R$";
}
export function label(pt, en, es) {
  return window.__lang === "en" ? en : window.__lang === "es" ? es : pt;
}
