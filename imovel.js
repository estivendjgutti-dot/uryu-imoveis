import { getProperty, photoUrl, money, whatsapp, el, isDemo } from "./data.js";
const root = document.querySelector("#property-detail");
try {
  const id = new URLSearchParams(location.search).get("id");
  const i = id ? await getProperty(id) : null;
  if (!i) {
    root.replaceChildren(
      el("h1", "", "Imóvel indisponível"),
      el(
        "p",
        "muted",
        "Este imóvel pode ter sido retirado do catálogo. Veja outras opções ou fale com a Uryu.",
      ),
    );
  } else {
    document.title = `${i.titulo} | Uryu Imóveis`;
    root.replaceChildren();
    if (isDemo)
      root.append(
        el("p", "notice", "Prévia demonstrativa: dados do protótipo."),
      );
    const heading = el("header", "detail-heading");
    heading.append(
      el(
        "p",
        "eyebrow",
        `${i.negociacao === "venda" ? "À venda" : "Para alugar"} · ${i.codigo}`,
      ),
      el("h1", "", i.titulo),
      el("p", "muted", `${i.bairro} · ${i.cidade}/${i.estado}`),
    );
    root.append(heading);
    const layout = el("div", "detail-layout"),
      gallery = el("div"),
      aside = el("aside", "detail-aside");
    const photos = i.fotos.map(photoUrl).filter(Boolean);
    if (photos.length) {
      const img = el("img", "detail-photo");
      img.src = photos[0];
      img.alt = i.titulo;
      gallery.append(img);
      const thumbs = el("div", "thumbnails");
      photos.forEach((url, n) => {
        const b = el("button");
        b.type = "button";
        b.setAttribute("aria-label", `Ver foto ${n + 1}`);
        b.setAttribute("aria-pressed", String(n === 0));
        const small = el("img");
        small.src = url;
        small.alt = `Foto ${n + 1} de ${i.titulo}`;
        small.loading = "lazy";
        b.append(small);
        b.addEventListener("click", () => {
          img.src = url;
          thumbs
            .querySelectorAll("button")
            .forEach((button) =>
              button.setAttribute("aria-pressed", String(button === b)),
            );
        });
        thumbs.append(b);
      });
      gallery.append(thumbs);
    } else gallery.append(el("p", "empty-state", "Fotos em preparação."));
    const facts = el("div", "detail-facts");
    for (const [v, label] of [
      [`${i.tamanho} m²`, "Área"],
      [i.quartos, "Quartos"],
      [i.banheiros, "Banheiros"],
      [i.vagas, "Vagas"],
    ]) {
      const box = el("div");
      box.append(el("strong", "", v), el("span", "", label));
      facts.append(box);
    }
    gallery.append(
      facts,
      el("h2", "detail-description", "Sobre este imóvel"),
      el(
        "p",
        "detail-description",
        i.descricao ||
          "Fale com um consultor para conhecer os detalhes e agendar uma visita.",
      ),
    );
    if (i.caracteristicas?.length)
      gallery.append(el("p", "muted", i.caracteristicas.join(" · ")));
    aside.append(
      el(
        "p",
        "eyebrow",
        i.negociacao === "venda" ? "Valor de venda" : "Aluguel mensal",
      ),
      el(
        "p",
        "detail-price",
        money(i.preco) + (i.negociacao === "aluguel" ? " /mês" : ""),
      ),
    );
    if (i.condominio)
      aside.append(el("p", "muted", `Condomínio: ${money(i.condominio)} /mês`));
    if (i.iptu) aside.append(el("p", "muted", `IPTU: ${money(i.iptu)} /ano`));
    aside.append(
      el(
        "p",
        "muted",
        `Fase: ${{ pronto: "Pronto", obras: "Em obras", planta: "Na planta" }[i.fase] || i.fase}`,
      ),
    );
    const contact = el("a", "action", "Agendar visita pelo WhatsApp ↗");
    contact.href = whatsapp(i);
    contact.target = "_blank";
    contact.rel = "noopener";
    const phone = el("a", "action secondary", "Ligar para a Uryu");
    phone.href = "tel:+5511959821054";
    aside.append(
      contact,
      phone,
      el("p", "muted", "Valores e disponibilidade sujeitos à confirmação."),
    );
    layout.append(gallery, aside);
    root.append(layout);
  }
} catch (e) {
  root.replaceChildren(
    el("h1", "", "Não foi possível carregar o imóvel"),
    el(
      "p",
      "muted",
      "Tente novamente ou fale com a Uryu pelo telefone (11) 95982-1054.",
    ),
  );
}
