import { request, setToken, isDemo, apiBase, el, money } from "./data.js";
const login = document.querySelector("#login-form"),
  panel = document.querySelector("#admin-panel"),
  editor = document.querySelector("#editor"),
  message = document.querySelector("#admin-message");
let properties = [],
  editing = null,
  photos = [],
  uploading = false,
  saving = false,
  dirty = false,
  authToken = "";
const previews = new Map();
function notify(text, error = false, target = message) {
  target.textContent = text;
  target.className = error ? "error-message" : "success-message";
}
function revoke() {
  for (const url of previews.values()) URL.revokeObjectURL(url);
  previews.clear();
}
function lock() {
  editor.querySelector("button[type=submit]").disabled = uploading || saving;
  document.querySelector("#photo-upload").disabled = uploading || saving;
  document.querySelector("#cancel-edit").disabled = uploading || saving;
}
async function refresh() {
  properties = await request("/admin/properties");
  renderList();
}
function renderList() {
  const q = document
    .querySelector("#admin-search")
    .value.toLocaleLowerCase("pt-BR");
  const list = document.querySelector("#admin-list");
  list.replaceChildren();
  document.querySelector("#admin-count").textContent =
    `${properties.length} imóveis cadastrados`;
  properties
    .filter((i) =>
      (i.titulo + " " + i.codigo).toLocaleLowerCase("pt-BR").includes(q),
    )
    .forEach((i) => {
      const row = el("article", "admin-row");
      const info = el("div");
      info.append(
        el("strong", "", `${i.codigo} · ${i.titulo}`),
        el("p", "muted", `${i.status} · ${i.cidade} · ${money(i.preco)}`),
      );
      const actions = el("div");
      const edit = el("button", "action secondary", "Editar");
      edit.addEventListener("click", () => openEditor(i));
      actions.append(edit);
      if (i.status === "publicado") {
        const archive = el("button", "text-button", "Arquivar");
        archive.addEventListener("click", async () => {
          archive.disabled = true;
          try {
            await request("/admin/properties/" + i.id + "/status", {
              method: "PATCH",
              body: JSON.stringify({ status: "arquivado" }),
            });
            await refresh();
            notify("Imóvel arquivado; ele saiu do catálogo deste ambiente.");
          } catch (e) {
            notify(e.message, true);
          } finally {
            archive.disabled = false;
          }
        });
        actions.append(archive);
      }
      row.append(info, actions);
      list.append(row);
    });
  if (!list.children.length)
    list.append(
      el(
        "p",
        "empty-state",
        "Nenhum imóvel encontrado. Cadastre um imóvel para começar.",
      ),
    );
}
async function renderPhotos() {
  const list = document.querySelector("#upload-list");
  list.replaceChildren();
  for (const [index, file] of photos.entries()) {
    const item = el("div", "upload-item");
    const img = el("img");
    img.alt = `Foto ${index + 1}${index === 0 ? " · capa" : ""}`;
    if (file.startsWith("https://")) img.src = file;
    else if (previews.has(file)) img.src = previews.get(file);
    else {
      try {
        const response = await fetch(apiBase + "/api/admin/media/" + file, {
          headers: { Authorization: "Bearer " + authToken },
          signal: AbortSignal.timeout(20000),
        });
        if (response.ok) {
          const url = URL.createObjectURL(await response.blob());
          previews.set(file, url);
          if (photos.includes(file)) img.src = url;
          else {
            URL.revokeObjectURL(url);
            previews.delete(file);
          }
        }
      } catch {
        img.alt = "Não foi possível carregar a foto";
      }
    }
    item.append(
      img,
      el("p", "muted", index === 0 ? "Capa" : `Foto ${index + 1}`),
    );
    const up = el("button", "text-button", "←");
    up.type = "button";
    up.setAttribute("aria-label", "Mover foto para a esquerda");
    up.disabled = index === 0 || uploading;
    up.addEventListener("click", () => {
      [photos[index - 1], photos[index]] = [photos[index], photos[index - 1]];
      dirty = true;
      renderPhotos();
    });
    const down = el("button", "text-button", "→");
    down.type = "button";
    down.setAttribute("aria-label", "Mover foto para a direita");
    down.disabled = index === photos.length - 1 || uploading;
    down.addEventListener("click", () => {
      [photos[index + 1], photos[index]] = [photos[index], photos[index + 1]];
      dirty = true;
      renderPhotos();
    });
    const remove = el("button", "text-button", "Remover");
    remove.type = "button";
    remove.disabled = uploading;
    remove.addEventListener("click", () => {
      photos = photos.filter((f) => f !== file);
      dirty = true;
      renderPhotos();
    });
    item.append(up, down, remove);
    list.append(item);
  }
}
function openEditor(i = null) {
  revoke();
  editing = i;
  photos = [...(i?.fotos || [])];
  editor.reset();
  for (const input of editor.elements) {
    if (!input.name || !i) continue;
    if (input.type === "checkbox") input.checked = !!i[input.name];
    else
      input.value =
        input.name === "caracteristicas"
          ? (i.caracteristicas || []).join(", ")
          : (i[input.name] ?? "");
  }
  panel.hidden = true;
  editor.hidden = false;
  document.querySelector("#editor-title").textContent = i
    ? "Editar imóvel"
    : "Novo imóvel";
  document.querySelector("#editor-message").textContent = "";
  dirty = false;
  renderPhotos();
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}
login.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = login.querySelector("button");
  button.disabled = true;
  try {
    const data = await request("/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(login))),
    });
    authToken = data.token;
    setToken(authToken);
    await refresh();
    login.reset();
    login.hidden = true;
    panel.hidden = false;
    notify(
      "Painel conectado. Alterações valem somente para o banco deste ambiente.",
    );
  } catch (e) {
    setToken("");
    authToken = "";
    notify(e.message, true);
  } finally {
    button.disabled = false;
  }
});
document
  .querySelector("#new-property")
  .addEventListener("click", () => openEditor());
document.querySelector("#admin-search").addEventListener("input", renderList);
document.querySelector("#cancel-edit").addEventListener("click", () => {
  if (dirty && !confirm("Descartar as alterações não salvas?")) return;
  dirty = false;
  revoke();
  editor.hidden = true;
  panel.hidden = false;
});
document.querySelector("#logout").addEventListener("click", () => {
  if (dirty && !confirm("Sair e descartar alterações não salvas?")) return;
  setToken("");
  authToken = "";
  dirty = false;
  properties = [];
  revoke();
  panel.hidden = true;
  editor.hidden = true;
  login.hidden = false;
  notify("Você saiu do painel.");
});
editor.addEventListener("input", () => {
  dirty = true;
});
addEventListener("beforeunload", (e) => {
  if (dirty || uploading || saving) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document
  .querySelector("#photo-upload")
  .addEventListener("change", async (e) => {
    const files = [...e.target.files];
    if (photos.length + files.length > 30) {
      notify(
        "Limite de 30 fotos por imóvel.",
        true,
        document.querySelector("#editor-message"),
      );
      e.target.value = "";
      return;
    }
    uploading = true;
    lock();
    await renderPhotos();
    try {
      for (const file of files) {
        if (file.size > 12 * 1024 * 1024)
          throw new Error(`${file.name}: limite de 12 MB.`);
        const form = new FormData();
        form.append("photo", file);
        const uploaded = await request("/admin/media", {
          method: "POST",
          body: form,
        });
        photos.push(uploaded.filename);
        previews.set(uploaded.filename, URL.createObjectURL(file));
        dirty = true;
      }
      notify(
        "Fotos enviadas. Salve o imóvel para confirmar.",
        false,
        document.querySelector("#editor-message"),
      );
    } catch (err) {
      notify(err.message, true, document.querySelector("#editor-message"));
    } finally {
      uploading = false;
      e.target.value = "";
      lock();
      renderPhotos();
    }
  });
editor.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (uploading || saving) return;
  const body = Object.fromEntries(new FormData(editor));
  for (const k of [
    "preco",
    "tamanho",
    "quartos",
    "banheiros",
    "vagas",
    "condominio",
    "iptu",
  ])
    body[k] = Number(body[k]);
  body.destaque = editor.elements.destaque.checked;
  body.caracteristicas = body.caracteristicas
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  body.fotos = photos;
  if (
    body.status === "publicado" &&
    (!body.descricao.trim() || !photos.length)
  ) {
    notify(
      "Para publicar, adicione descrição e ao menos uma foto.",
      true,
      document.querySelector("#editor-message"),
    );
    return;
  }
  saving = true;
  lock();
  try {
    const saved = await request(
      "/admin/properties" + (editing ? "/" + editing.id : ""),
      { method: editing ? "PUT" : "POST", body: JSON.stringify(body) },
    );
    editing = saved;
    dirty = false;
    notify("Imóvel salvo.", false, document.querySelector("#editor-message"));
    await refresh();
    notify("Cadastro atualizado neste ambiente.");
  } catch (err) {
    notify(err.message, true, document.querySelector("#editor-message"));
  } finally {
    saving = false;
    lock();
  }
});
if (isDemo) {
  login.querySelector("button").disabled = true;
  notify(
    "O painel ficará disponível quando a API e o PostgreSQL forem conectados. Esta prévia usa os imóveis demonstrativos.",
    true,
  );
}
