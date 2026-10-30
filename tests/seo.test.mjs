import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderPropertyPage, renderNotFound, sitemapXml, propertyMeta, propertyJsonLd } from "../api/_seo.js";

const base = "https://abc.supabase.co";
const property = {
  id: "11111111-2222-3333-4444-555555555555",
  codigo: "URY-0001",
  titulo: "Apartamento <3 quartos> em Bela Vista",
  categoria: "apartamento",
  negociacao: "venda",
  status: "publicado",
  bairro: "Bela Vista",
  cidade: "Osasco",
  estado: "SP",
  preco: 890000,
  tamanho: 112,
  quartos: 3,
  banheiros: 2,
  vagas: 2,
  descricao: "Sala ampla com varanda gourmet e vista livre.",
  caracteristicas: ["Varanda gourmet", "Elevador"],
  fotos: ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp"],
  demonstrativo: false,
  created_at: "2026-10-30T10:00:00Z",
  updated_at: "2026-10-30T12:00:00Z",
};
const template = await readFile(new URL("../imovel.html", import.meta.url), "utf8");

test("page gets its own title, description, canonical and Open Graph image", () => {
  const html = renderPropertyPage(template, property, base);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.match(html, /<title>Apartamento &lt;3 quartos&gt; em Bela Vista[^<]*\| Uryu<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/uryuimoveis\.com\.br\/imovel\?id=11111111-2222-3333-4444-555555555555"/);
  assert.match(html, /og:image" content="https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/fotos\/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\.webp"/);
  assert.match(html, /name="description" content="Apartamento à venda em Bela Vista, Osasco\/SP\. 112 m² · 3 quartos · 2 vagas\. R\$ 890\.000\./);
  assert.doesNotMatch(html, /name="robots"/);
  assert.doesNotMatch(html, /imoveis\.js/);
});

test("user text is escaped in attributes and cannot break out of JSON-LD", () => {
  const html = renderPropertyPage(template, { ...property, titulo: 'x"><script>alert(1)</script>', descricao: "</script><b>" }, base);
  assert.doesNotMatch(html, /<script>alert/);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(blocks.length, 2);
  for (const b of blocks) assert.doesNotThrow(() => JSON.parse(b));
});

test("structured data carries price, area and photos but never a street address", () => {
  const [listing, crumbs] = propertyJsonLd(property, base);
  assert.equal(listing["@type"], "RealEstateListing");
  assert.equal(listing.offers.price, 890000);
  assert.equal(listing.offers.priceCurrency, "BRL");
  assert.equal(listing.about["@type"], "Apartment");
  assert.equal(listing.about.numberOfBedrooms, 3);
  assert.equal(listing.about.address.streetAddress, undefined);
  assert.equal(listing.image.length, 1);
  assert.equal(crumbs.itemListElement.length, 3);
});

test("rentals are priced per month", () => {
  const [listing] = propertyJsonLd({ ...property, negociacao: "aluguel", preco: 3500 }, base);
  assert.equal(listing.offers.priceSpecification.unitText, "MONTH");
  assert.match(propertyMeta({ ...property, negociacao: "aluguel", preco: 3500 }, base).description, /para alugar.*R\$ 3\.500\/mês/);
});

test("demonstration listings are noindex and stay out of the sitemap", () => {
  const demo = { ...property, demonstrativo: true };
  assert.match(renderPropertyPage(template, demo, base), /<meta name="robots" content="noindex, follow"/);
  const xml = sitemapXml([demo, { ...property, id: "99999999-2222-3333-4444-555555555555" }]);
  assert.doesNotMatch(xml, /11111111-2222/);
  assert.match(xml, /99999999-2222-3333-4444-555555555555<\/loc><lastmod>2026-10-30<\/lastmod>/);
  assert.match(xml, /<loc>https:\/\/uryuimoveis\.com\.br\/<\/loc>/);
});

test("unknown listings are served noindex", () => {
  assert.match(renderNotFound(template), /<head>\n\s*<meta name="robots" content="noindex, nofollow"/);
});
