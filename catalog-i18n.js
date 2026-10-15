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
  Studio: ["Studio", "Estudio"],
  Kitnet: ["Kitchenette apartment", "Apartamento compacto"],
  Cobertura: ["Penthouse", "Ático"],
  Sobrado: ["Townhouse", "Casa de dos plantas"],
  "Casa em condomínio": ["Gated-community house", "Casa en condominio"],
  "Sala comercial": ["Office suite", "Oficina"],
  "Ponto comercial / loja": ["Retail space / shop", "Local comercial / tienda"],
  Galpão: ["Warehouse", "Nave industrial"],
  Chácara: ["Country property", "Finca"],
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
Object.assign(phrases, {
  "Patrimônio e família": ["Property and family", "Patrimonio y familia"],
  "Doação em vida: planejar hoje, cuidar do amanhã.": ["Lifetime property gifts: plan today, care for tomorrow.", "Donación en vida: planificar hoy, cuidar del mañana."],
  "A doação de um imóvel em vida pode fazer parte do planejamento sucessório. Conhecer as possibilidades e os limites ajuda a tomar uma decisão alinhada à sua família.": ["Giving a property during your lifetime can be part of succession planning. Understanding the options and limits helps you make a decision suited to your family.", "Donar un inmueble en vida puede formar parte de la planificación sucesoria. Conocer las posibilidades y los límites ayuda a decidir de acuerdo con su familia."],
  "Organização antecipada": ["Planning ahead", "Organización anticipada"],
  "Definir a transmissão de um imóvel durante a vida permite discutir objetivos e condições com antecedência, respeitando os direitos dos herdeiros.": ["Arranging a property transfer during your lifetime allows you to discuss objectives and conditions in advance while respecting heirs’ rights.", "Definir la transmisión de un inmueble en vida permite discutir objetivos y condiciones con antelación, respetando los derechos de los herederos."],
  "Possibilidade de usufruto": ["Possibility of retaining usufruct", "Posibilidad de usufructo"],
  "Quando previsto e formalizado, o usufruto permite ao doador conservar o uso do imóvel ou os rendimentos de aluguel, conforme as condições do ato.": ["When provided for and formalized, usufruct allows the donor to retain use of the property or rental income under the terms of the deed.", "Cuando está previsto y formalizado, el usufructo permite al donante conservar el uso del inmueble o las rentas del alquiler, según las condiciones del acto."],
  "Clareza para a família": ["Clarity for the family", "Claridad para la familia"],
  "Um planejamento bem documentado ajuda a tornar intenções e responsabilidades mais claras. A adequação da doação depende da situação patrimonial e familiar.": ["Well-documented planning helps clarify intentions and responsibilities. Whether a gift is appropriate depends on your assets and family circumstances.", "Una planificación bien documentada ayuda a aclarar intenciones y responsabilidades. La idoneidad de la donación depende de la situación patrimonial y familiar."],
  "O que avaliar antes de decidir?": ["What should you consider before deciding?", "¿Qué evaluar antes de decidir?"],
  "A doação transfere direitos e exige avaliar a subsistência do doador, a parcela dos herdeiros necessários, os documentos e os custos de formalização. Pode haver ITCMD e outras obrigações tributárias. Ela não garante economia de impostos nem elimina, por si só, a necessidade de inventário de outros bens.": ["A gift transfers rights and requires consideration of the donor’s livelihood, protected heirs’ shares, documents and formalization costs. ITCMD and other tax obligations may apply. A gift does not guarantee tax savings or, by itself, eliminate probate for other assets.", "La donación transmite derechos y exige evaluar la subsistencia del donante, la parte de los herederos forzosos, los documentos y los costes de formalización. Puede haber ITCMD y otras obligaciones tributarias. No garantiza ahorro fiscal ni elimina por sí sola la sucesión de otros bienes."],
  "Analise o caso com advogado, tabelião e contador. Este conteúdo é informativo e não substitui orientação jurídica ou tributária individual.": ["Review your case with a lawyer, notary and accountant. This information does not replace individual legal or tax advice.", "Analice el caso con abogado, notario y contador. Esta información no sustituye el asesoramiento jurídico o tributario individual."],
  "Código Civil": ["Brazilian Civil Code", "Código Civil de Brasil"],
  "ITCMD e usufruto em São Paulo": ["ITCMD and usufruct in São Paulo", "ITCMD y usufructo en São Paulo"],
  "Quer conversar sobre o seu imóvel?": ["Would you like to discuss your property?", "¿Quiere conversar sobre su inmueble?"],
  "Conte à Uryu o que você está planejando.": ["Tell Uryu what you are planning.", "Cuéntele a Uryu qué está planificando."],
  "Conversar sobre meu imóvel ↗": ["Discuss my property ↗", "Conversar sobre mi inmueble ↗"],
});
const nodes = [];
for (const root of document.querySelectorAll(
  "#catalogo,#comprar,#alugar,.contact-invite,#planejamento",
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
