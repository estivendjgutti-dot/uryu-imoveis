import { getProperties, isDemo, propertyCard, el } from "./data.js";
import { translateCatalog, label } from "./catalog-i18n.js";
const form = document.querySelector("#property-search");
let properties = [];
const status = document.querySelector("#catalog-status");
const sort = document.querySelector("#sort-properties");
function options(name, values, label) {
  const select = form.elements[name],
    previous = select.value;
  select.replaceChildren(
    new Option(label, ""),
    ...[...new Set(values)]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((v) => new Option(v, v)),
  );
  if (values.includes(previous)) select.value = previous;
}
function neighborhoods() {
  options(
    "bairro",
    properties
      .filter(
        (i) =>
          !form.elements.cidade.value ||
          i.cidade === form.elements.cidade.value,
      )
      .map((i) => i.bairro),
    label("Todos os bairros", "All neighborhoods", "Todos los barrios"),
  );
}
function render() {
  const q = Object.fromEntries(new FormData(form));
  const items = properties.filter(
    (i) =>
      (!q.negociacao || i.negociacao === q.negociacao) &&
      (!q.cidade || i.cidade === q.cidade) &&
      (!q.bairro || i.bairro === q.bairro) &&
      (!q.categoria || i.categoria === q.categoria) &&
      (!q.fase || i.fase === q.fase) &&
      (!q.preco || i.preco <= Number(q.preco)) &&
      ["quartos", "banheiros", "vagas", "tamanho"].every(
        (k) => !q[k] || i[k] >= Number(q[k]),
      ),
  );
  if (sort.value === "menor") items.sort((a, b) => a.preco - b.preco);
  if (sort.value === "maior") items.sort((a, b) => b.preco - a.preco);
  if (sort.value === "area") items.sort((a, b) => b.tamanho - a.tamanho);
  status.textContent = label(
    `${items.length} ${items.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}`,
    `${items.length} properties found`,
    `${items.length} inmuebles encontrados`,
  );
  const grid = document.querySelector("#catalog-grid");
  grid.replaceChildren(...items.map(propertyCard));
  if (!items.length)
    grid.append(
      el(
        "p",
        "empty-state",
        label(
          "Nenhum imóvel atende a esses filtros. Ajuste a busca ou fale com um consultor.",
          "No properties match these filters. Adjust your search or contact an advisor.",
          "No hay inmuebles con estos filtros. Ajusta la búsqueda o habla con un asesor.",
        ),
      ),
    );
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  render();
});
form.addEventListener("change", (e) => {
  if (e.target.name === "cidade") neighborhoods();
  render();
});
form.addEventListener("reset", () =>
  setTimeout(() => {
    neighborhoods();
    render();
  }, 0),
);
sort.addEventListener("change", render);
document.querySelectorAll("[data-purpose]").forEach((link) =>
  link.addEventListener("click", () => {
    form.reset();
    form.elements.negociacao.value = link.dataset.purpose;
    neighborhoods();
    render();
  }),
);
try {
  properties = await getProperties();
  options(
    "cidade",
    properties.map((i) => i.cidade),
    label("Todas as cidades", "All cities", "Todas las ciudades"),
  );
  neighborhoods();
  translateCatalog();
  render();
  for (const [selector, purpose] of [
    ["#sale-grid", "venda"],
    ["#rent-grid", "aluguel"],
  ]) {
    const items = properties
      .filter((i) => i.negociacao === purpose)
      .sort((a, b) => Number(b.destaque) - Number(a.destaque))
      .slice(0, 3);
    document
      .querySelector(selector)
      .replaceChildren(...items.map(propertyCard));
    if (!items.length)
      document
        .querySelector(selector)
        .append(
          el(
            "p",
            "empty-state",
            "Novas oportunidades em breve. Fale com um consultor.",
          ),
        );
  }
  if (isDemo) {
    const notice = document.querySelector("#catalog-notice");
    notice.hidden = false;
    notice.textContent =
      "Prévia demonstrativa: imóveis e valores do protótipo, sujeitos à substituição pelo cadastro real.";
  }
} catch (e) {
  status.textContent = "Não foi possível carregar o catálogo.";
  const retry = el("button", "text-button", "Tentar novamente");
  retry.addEventListener("click", () => location.reload());
  document
    .querySelector("#catalog-grid")
    .append(
      el(
        "p",
        "empty-state",
        "Tente novamente ou fale com um consultor pelo WhatsApp.",
      ),
      retry,
    );
}
// Keep the unchanged logo compact; the artwork remains the original.
document.querySelector("#menu-btn")?.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelector("#mobile-menu").classList.add("hidden");
    e.currentTarget.setAttribute("aria-expanded", "false");
  }
});
window.__searchRefresh = () => {
  translateCatalog();
  options(
    "cidade",
    properties.map((i) => i.cidade),
    label("Todas as cidades", "All cities", "Todas las ciudades"),
  );
  neighborhoods();
  render();
  for (const [selector, purpose] of [
    ["#sale-grid", "venda"],
    ["#rent-grid", "aluguel"],
  ])
    document.querySelector(selector).replaceChildren(
      ...properties
        .filter((i) => i.negociacao === purpose)
        .sort((a, b) => Number(b.destaque) - Number(a.destaque))
        .slice(0, 3)
        .map(propertyCard),
    );
};
