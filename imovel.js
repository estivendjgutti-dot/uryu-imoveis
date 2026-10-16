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
    if (isDemo || i.demonstrativo)
      root.append(
        el("p", "notice", "IMÓVEL DEMONSTRATIVO. Dados e valores fictícios; imagens geradas por IA. Não representa uma oferta real."),
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
      let activePhoto = 0, suppressOpenUntil = 0;
      const img = el("img", "detail-photo");
      img.src = photos[0];
      img.alt = i.titulo;
      img.fetchPriority="high"; img.decoding="async";
      const stage = el('div','gallery-stage');
      const open = el('button','gallery-open'); open.type='button'; open.setAttribute('aria-label','Ampliar fotos do imóvel'); open.append(img);
      const counter = el('span','gallery-counter');counter.setAttribute('aria-live','polite');
      const previous = el('button','gallery-arrow gallery-prev','‹'), next = el('button','gallery-arrow gallery-next','›');
      previous.type=next.type='button'; previous.setAttribute('aria-label','Foto anterior'); next.setAttribute('aria-label','Próxima foto');
      stage.append(open,previous,next,counter); gallery.append(stage);
      const dialog=el('dialog','photo-dialog'); dialog.setAttribute('aria-label','Galeria de fotos do imóvel');
      const full=el('img'); full.alt=i.titulo;
      const close=el('button','gallery-close','Fechar ×'), modalPrev=el('button','gallery-arrow gallery-prev','‹'), modalNext=el('button','gallery-arrow gallery-next','›');
      close.type=modalPrev.type=modalNext.type='button'; modalPrev.setAttribute('aria-label','Foto anterior'); modalNext.setAttribute('aria-label','Próxima foto');
      dialog.append(full,close,modalPrev,modalNext); document.body.append(dialog);
      function showPhoto(n) {
        activePhoto=(n+photos.length)%photos.length; img.src=full.src=photos[activePhoto];
        img.alt=full.alt='Foto '+(activePhoto+1)+' de '+photos.length+' · '+i.titulo;
        counter.textContent=(activePhoto+1)+' / '+photos.length+' · Ampliar';
        thumbs.querySelectorAll('button').forEach((b,index)=>b.setAttribute('aria-pressed',String(index===activePhoto)));
      }
      previous.addEventListener('click',()=>showPhoto(activePhoto-1)); next.addEventListener('click',()=>showPhoto(activePhoto+1));
      modalPrev.addEventListener('click',()=>showPhoto(activePhoto-1)); modalNext.addEventListener('click',()=>showPhoto(activePhoto+1));
      open.addEventListener('click',()=>{if(Date.now()<suppressOpenUntil)return;dialog.showModal(); document.body.classList.add('gallery-lock'); close.focus();});
      close.addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>{document.body.classList.remove('gallery-lock');open.focus();});
      dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
      dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(activePhoto-1)}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(activePhoto+1)}});
      let startX=0,startY=0;
      for(const target of [open,full]) { target.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX; startY=e.changedTouches[0].clientY},{passive:true}); target.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){suppressOpenUntil=Date.now()+400;showPhoto(activePhoto+(dx<0?1:-1));}},{passive:true}); }
      previous.hidden=next.hidden=modalPrev.hidden=modalNext.hidden=photos.length<2;
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
        b.addEventListener('click', () => showPhoto(n));
        thumbs.append(b);
      });
      thumbs.hidden=photos.length<2;
      gallery.append(thumbs);
      showPhoto(0);
    } else gallery.append(el("p", "empty-state", "Fotos em preparação."));
    const facts = el("div", "detail-facts");
    for (const [v, label] of [
      [`${i.tamanho} m²`, ({privativa:"Área privativa",construida:"Área construída",lote:"Área do lote"}[i.tipo_area] || (i.categoria === "terreno" ? "Área do lote" : "Área total"))],
      [i.quartos, "Quartos"],
      [i.banheiros, "Banheiros"],
      [i.vagas, "Vagas"],
    ]) {
      if (label !== "Área total" && typeof v === "number" && v === 0) continue;
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
    const mobileBar=el('div','mobile-property-contact');
    mobileBar.append(el('strong','',money(i.preco)+(i.negociacao==='aluguel'?' /mês':'')));
    const mobileLink=el('a','action','Tenho interesse ↗'); mobileLink.href=whatsapp(i); mobileLink.target='_blank'; mobileLink.rel='noopener'; mobileBar.append(mobileLink); document.body.append(mobileBar);
    const phone = el("a", "text-button detail-back", "← Continuar buscando");
    phone.href = "index.html#catalogo";

    phone.rel = "noopener";
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
      "Tente novamente ou fale com a Uryu pelo WhatsApp (11) 97050-8331.",
    ),
  );
}
