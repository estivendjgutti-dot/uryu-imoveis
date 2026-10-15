const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const entryObserver=new IntersectionObserver(entries=>{for(const entry of entries) if(entry.isIntersecting){entryObserver.unobserve(entry.target);if(!motionPreference.matches) entry.target.animate([{opacity:.2,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'cubic-bezier(.2,.7,.2,1)'});}}, {threshold:.08});
function animateEntries(nodes){for(const node of nodes)entryObserver.observe(node);}
const railHandlers=new WeakMap();
function setupFeaturedRails(){
 for(const id of ['sale-grid','rent-grid']){
  const rail=document.getElementById(id); let controls=document.getElementById(id+'-controls');
  if(controls)controls.remove();
  if(rail.children.length<2)continue;
  controls=document.createElement('div');controls.id=id+'-controls';controls.className='rail-controls';
  const previous=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
  previous.type=next.type='button';previous.textContent='←';next.textContent='→';
  previous.setAttribute('aria-label',label('Imóvel anterior','Previous property','Inmueble anterior')); next.setAttribute('aria-label',label('Próximo imóvel','Next property','Siguiente inmueble'));
  const update=()=>{const step=rail.children[1].offsetLeft-rail.children[0].offsetLeft;const index=step?Math.round(rail.scrollLeft/step):0;count.textContent=(index+1)+' / '+rail.children.length+' · '+label('Deslize para explorar','Swipe to explore','Desliza para explorar');previous.disabled=index===0;next.disabled=index>=rail.children.length-1;};
  for(const [button,direction] of [[previous,-1],[next,1]])button.addEventListener('click',()=>rail.scrollBy({left:direction*(rail.children[1].offsetLeft-rail.children[0].offsetLeft),behavior:motionPreference.matches?'instant':'smooth'}));
  if(railHandlers.has(rail))rail.removeEventListener('scroll',railHandlers.get(rail));
  railHandlers.set(rail,update);rail.addEventListener('scroll',update,{passive:true});controls.append(previous,count,next);rail.after(controls);update();animateEntries(rail.querySelectorAll('.property-card'));
 }
}
import { getProperties, isDemo, propertyCard, featuredCompare, el } from "./data.js";
import { translateCatalog, label } from "./catalog-i18n.js";
const form = document.querySelector("#property-search");
let properties = [];
const searchKey = 'uryu-search-v2';
const smallScreen = matchMedia('(max-width: 760px)');
let page = 1;
const savedSearch = (()=>{try{return JSON.parse(sessionStorage.getItem(searchKey)||'null')}catch{return null}})();
function rememberSearch() {
  try {sessionStorage.setItem(searchKey,JSON.stringify({fields:Object.fromEntries(new FormData(form)),sort:sort.value,y:scrollY,page}));} catch {}
}
document.addEventListener('click', e=> {if(e.target.closest('a[href*="imovel.html?id="]')) rememberSearch();});
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
function render(resetPage = true) {
  if (resetPage) page = 1;
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
  const pageSize=smallScreen.matches?2:9;
  const pageCount=Math.max(1,Math.ceil(items.length/pageSize));
  page=Math.min(Math.max(1,page),pageCount);
  for(const child of grid.children)entryObserver.unobserve(child);
  grid.replaceChildren(...items.slice((page-1)*pageSize,page*pageSize).map(propertyCard));
  animateEntries(grid.querySelectorAll('.property-card'));
  const paging=document.querySelector('#catalog-pagination');
  paging.replaceChildren();
  if(pageCount>1) {
    const previous=el('button','page-arrow',label('← Anterior','← Previous','← Anterior'));
    const next=el('button','page-arrow',label('Próxima →','Next →','Siguiente →'));
    previous.type=next.type='button'; previous.disabled=page===1; next.disabled=page===pageCount;
    const info=el('span','',label('Página','Page','Página')+' '+page+' / '+pageCount);
    info.setAttribute('aria-live','polite');
    const go=direction=>{page+=direction;render(false);const top=document.querySelector('#catalog-grid').getBoundingClientRect().top+scrollY-100;scrollTo({top,behavior:motionPreference.matches?'instant':'smooth'});document.querySelector('#catalog-grid a')?.focus({preventScroll:true});};
    previous.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
    paging.append(previous,info,next);
  }
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
sort.addEventListener("change", () => render());
smallScreen.addEventListener("change", () => {render();setupFeaturedRails();});
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
  if(savedSearch?.fields) for(const [key,value] of Object.entries(savedSearch.fields)) {if(form.elements[key]) form.elements[key].value=value;}
  neighborhoods();
  if(savedSearch?.fields?.bairro) form.elements.bairro.value=savedSearch.fields.bairro;
  if(savedSearch?.sort) sort.value=savedSearch.sort;
  if(savedSearch?.page) page=savedSearch.page;
  translateCatalog();
  render(false);
  if(savedSearch && location.hash === '#catalogo') requestAnimationFrame(()=>scrollTo({top:savedSearch.y||0,behavior:'instant'}));
  for (const [selector, purpose] of [
    ["#sale-grid", "venda"],
    ["#rent-grid", "aluguel"],
  ]) {
    const items = properties
      .filter((i) => i.negociacao === purpose)
      .sort(featuredCompare)
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
  setupFeaturedRails();
  animateEntries(document.querySelectorAll(".section-caption,.readable-panel,.planning-shell,.contact-invite,.reveal,#footer-content"));
  if (isDemo || properties.some((property) => property.demonstrativo)) {
    const notice = document.querySelector("#catalog-notice");
    notice.hidden = false;
    notice.textContent =
      "APRESENTAÇÃO: imóveis, preços e medidas fictícios. Imagens geradas por IA. Os exemplos não representam ofertas reais.";
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
        .sort(featuredCompare)
        .slice(0, 3)
        .map(propertyCard),
    );
  setupFeaturedRails();
};
