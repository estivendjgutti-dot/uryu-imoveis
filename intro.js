// Abertura com o vídeo da marca: toca uma vez por visita às páginas públicas e pode ser revista pelo botão da home.
(function () {
  var root = document.documentElement;
  var cream = "#f0e6d2";
  var css = document.createElement("style");
  css.textContent =
    "#intro{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:" + cream + ";transition:opacity .6s ease}" +
    "#intro.saindo{opacity:0;pointer-events:none}" +
    "#intro video{width:100%;height:100%;object-fit:contain;background:" + cream + "}" +
    "#intro button{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));padding:8px 16px;border:1px solid rgba(36,35,31,.35);border-radius:999px;background:rgba(240,230,210,.85);color:#24231f;font:500 14px/1 Manrope,system-ui,sans-serif;cursor:pointer}" +
    "html.com-intro body{overflow:hidden}";
  document.head.append(css);

  var overlay = null;
  function play() {
    if (overlay) return;
    var done = false;
    overlay = document.createElement("div");
    overlay.id = "intro";
    var video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.poster = "intro-poster.jpg";
    var skip = document.createElement("button");
    skip.type = "button";
    skip.textContent = "Pular";
    overlay.append(video, skip);
    root.classList.add("com-intro");
    root.append(overlay);
    function fim() {
      if (done) return;
      done = true;
      root.classList.remove("com-intro");
      overlay.classList.add("saindo");
      var el = overlay;
      overlay = null;
      setTimeout(function () { el.remove(); }, 700);
    }
    video.addEventListener("ended", fim);
    video.addEventListener("error", fim);
    skip.addEventListener("click", fim);
    video.src = matchMedia("(max-width: 900px)").matches ? "intro-720.mp4" : "intro.mp4";
    var p = video.play();
    if (p && p.catch) p.catch(fim);
    // Rede lenta ou autoplay bloqueado: não prende o visitante.
    setTimeout(function () { if (video.currentTime === 0) fim(); }, 4000);
    setTimeout(fim, 15000);
  }
  // Uma abertura por visita: quem já viu (na home ou num link de imóvel) não a vê de novo enquanto navega.
  // A marca vence com 30 min sem abrir nenhuma página; cada página aberta renova o prazo.
  var key = "uryu-intro-visto";
  var janela = 30 * 60 * 1000;
  function jaViu() {
    try {
      var t = Number(localStorage.getItem(key));
      if (t && Date.now() - t < janela) return true;
    } catch (e) {
      try { if (sessionStorage.getItem(key)) return true; } catch (e2) {}
    }
    return false;
  }
  function marcar() {
    try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
    try { sessionStorage.setItem(key, "1"); } catch (e) {}
  }
  window.uryuIntro = { play: play };
  var viu = jaViu();
  marcar();
  // Quem pede menos movimento não vê a abertura sozinha (o botão da home continua disponível).
  if (!viu && !matchMedia("(prefers-reduced-motion: reduce)").matches) play();
})();
