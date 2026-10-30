import { isDemo, el, money, photoUrl } from "./data.js";
import { signIn, signOut, listAll, saveProperty, setStatus, uploadPhoto, signUp, listAccess, inviteAdmin, removeAdmin, cancelInvite, currentUserId } from "./admin-db.js";
const login = document.querySelector("#login-form"),
  panel = document.querySelector("#admin-panel"),
  editor = document.querySelector("#editor"),
  message = document.querySelector("#admin-message");
let properties = [],
  editing = null,
  photos = [],
  uploading = false,
  saving = false,
  dirty = false;
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
  properties = await listAll();
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
            await setStatus(i, "arquivado");
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
    img.src = previews.get(file) || photoUrl(file);
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
const typeNames = {
  apartamento: "Apartamento", casa: "Casa", comercial: "Imóvel comercial", terreno: "Terreno",
  studio: "Studio", kitnet: "Kitnet", cobertura: "Cobertura", sobrado: "Sobrado",
  casa_condominio: "Casa em condomínio", sala_comercial: "Sala comercial",
  ponto_comercial: "Loja", galpao: "Galpão", chacara: "Chácara",
};
function updateTitleSuggestions() {
  const f = editor.elements;
  const tipo = typeNames[f.categoria.value] || "Imóvel";
  const fim = f.negociacao.value === "aluguel" ? "para alugar" : "à venda";
  const bairro = f.bairro.value.trim(), cidade = f.cidade.value.trim();
  const lugar = [bairro, cidade].filter(Boolean).join(", ");
  const q = Number(f.quartos.value) || 0, area = Number(f.tamanho.value) || 0;
  const quartos = q ? `${q} ${q === 1 ? "quarto" : "quartos"}` : "";
  const m2 = area ? `${area} m²` : "";
  const em = lugar ? ` em ${lugar}` : "";
  const ideas = [
    `${tipo} ${fim}${em}`,
    `${tipo}${quartos ? " com " + quartos : ""}${m2 ? " · " + m2 : ""}${bairro ? " - " + bairro : ""}`,
    `${tipo}${m2 ? " de " + m2 : ""} ${fim}${cidade ? " - " + cidade : ""}`,
    `${tipo}${quartos ? " " + quartos : ""} pronto para morar${bairro ? " no " + bairro : ""}`,
    `Oportunidade: ${tipo.toLowerCase()} ${fim}${em}`,
  ];
  if (["sala_comercial", "ponto_comercial", "comercial", "galpao"].includes(f.categoria.value))
    ideas[3] = `${tipo}${m2 ? " " + m2 : ""} em ótima localização${bairro ? " - " + bairro : ""}`;
  const list = document.querySelector("#titulo-sugestoes");
  list.replaceChildren(
    ...[...new Set(ideas.map((s) => s.replace(/\s+/g, " ").trim()))].map((s) => {
      const o = document.createElement("option");
      o.value = s;
      return o;
    }),
  );
}
function nextCode() {
  const n = properties
    .map((p) => Number((/^URY-(\d+)$/i.exec(p.codigo) || [])[1] || 0))
    .reduce((a, b) => Math.max(a, b), 0);
  return "URY-" + String(n + 1).padStart(4, "0");
}
let cepRequest = 0;
async function lookupCep() {
  const input = editor.elements.cep, status = document.querySelector("#cep-status");
  const cep = input.value.replace(/\D/g, "");
  if (cep.length > 5) input.value = cep.slice(0, 5) + "-" + cep.slice(5, 8);
  if (cep.length !== 8) {
    status.textContent = "Preenche cidade, bairro e UF";
    status.className = "field-hint";
    return;
  }
  const id = ++cepRequest;
  status.textContent = "Buscando endereço…";
  status.className = "field-hint";
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (id !== cepRequest) return;
    if (!r.ok || d.erro) throw new Error();
    const f = editor.elements;
    f.estado.value = d.uf || f.estado.value;
    f.cidade.value = d.localidade || f.cidade.value;
    if (d.bairro) f.bairro.value = d.bairro;
    if (d.logradouro && !f.private_notes.value.trim())
      f.private_notes.value = `${d.logradouro}, nº  — ${d.bairro || ""}, ${d.localidade}/${d.uf} · CEP ${cep.slice(0, 5)}-${cep.slice(5)}`;
    status.textContent = d.bairro ? "Endereço encontrado. Confira e ajuste se precisar." : "Cidade encontrada. Preencha o bairro.";
    status.className = "field-hint ok";
    dirty = true;
    updateTitleSuggestions();
  } catch {
    if (id !== cepRequest) return;
    status.textContent = "CEP não encontrado. Preencha cidade e bairro manualmente.";
    status.className = "field-hint error";
  }
}
editor.elements.cep.addEventListener("input", lookupCep);
for (const name of ["categoria", "negociacao", "bairro", "cidade", "quartos", "tamanho"])
  editor.elements[name].addEventListener("input", updateTitleSuggestions);
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
  if (!i) editor.elements.codigo.value = nextCode();
  if (i?.cep) editor.elements.cep.value = i.cep.slice(0, 5) + "-" + i.cep.slice(5);
  const status = document.querySelector("#cep-status");
  status.textContent = "Preenche cidade, bairro e UF";
  status.className = "field-hint";
  updateTitleSuggestions();
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
    const form = Object.fromEntries(new FormData(login));
    await signIn(form.email, form.password);
    await refresh();
    login.reset();
    login.hidden = true;
    panel.hidden = false;
    notify("Painel conectado.");
  } catch (e) {
    signOut();
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
  signOut();
  dirty = false;
  properties = [];
  revoke();
  panel.hidden = true;
  editor.hidden = true;
  accessPanel.hidden = true;
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
        const filename = await uploadPhoto(file);
        photos.push(filename);
        previews.set(filename, URL.createObjectURL(file));
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
  body.ordem_destaque = Number(editor.elements.ordem_destaque.value)||0;
  body.tipo_area = editor.elements.tipo_area.value;
  body.destaque = editor.elements.destaque.checked;
  body.demonstrativo = editor.elements.demonstrativo.checked;
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
    const saved = await saveProperty(body, editing?.id);
    const wasNew = !editing;
    dirty = false;
    revoke();
    editing = null;
    photos = [];
    editor.reset();
    document.querySelector("#upload-list").replaceChildren();
    document.querySelector("#editor-message").textContent = "";
    editor.hidden = true;
    panel.hidden = false;
    await refresh();
    notify(`${saved.codigo} · ${saved.titulo} ${wasNew ? "cadastrado" : "atualizado"}.`);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
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
    "O painel ficará disponível quando o banco for conectado. Esta prévia usa os imóveis demonstrativos.",
    true,
  );
}

const signup = document.querySelector("#signup-form"),
  accessPanel = document.querySelector("#access-panel"),
  accessMessage = document.querySelector("#access-message");
document.querySelector("#show-signup").addEventListener("click", () => {
  login.hidden = true;
  signup.hidden = false;
  message.textContent = "";
});
document.querySelector("#show-login").addEventListener("click", () => {
  signup.hidden = true;
  login.hidden = false;
  message.textContent = "";
});
signup.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = signup.querySelector("button.action");
  button.disabled = true;
  try {
    const needsConfirm = await signUp(
      document.querySelector("#signup-email").value,
      document.querySelector("#signup-password").value,
    );
    signup.reset();
    signup.hidden = true;
    login.hidden = false;
    notify(
      needsConfirm
        ? "Senha criada. Abra o e-mail de confirmação que enviamos e depois entre aqui com e-mail e senha."
        : "Senha criada. Entre com seu e-mail e senha.",
    );
  } catch (err) {
    notify(err.message, true);
  } finally {
    button.disabled = false;
  }
});

function accessRow(label, detail, actionText, onAction) {
  const row = el("article", "admin-row");
  const info = el("div");
  info.append(el("strong", "", label), el("p", "muted", detail));
  row.append(info);
  if (actionText) {
    const actions = el("div");
    const btn = el("button", "text-button", actionText);
    btn.type = "button";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await onAction();
        await renderAccess();
      } catch (err) {
        notify(err.message, true, accessMessage);
        btn.disabled = false;
      }
    });
    actions.append(btn);
    row.append(actions);
  }
  return row;
}
async function renderAccess() {
  const list = document.querySelector("#access-list");
  const { admins, invites } = await listAccess();
  const me = currentUserId();
  list.replaceChildren();
  for (const a of admins)
    list.append(
      a.user_id === me
        ? accessRow(a.email || "Você", "Você · acesso ativo")
        : accessRow(a.email || "Usuário sem e-mail", "Acesso ativo", "Remover acesso", async () => {
            if (!confirm(`Remover o acesso de ${a.email}?`)) throw new Error("Remoção cancelada.");
            await removeAdmin(a.user_id);
            notify(`Acesso de ${a.email} removido.`, false, accessMessage);
          }),
    );
  for (const i of invites)
    list.append(
      accessRow(i.email, "Convite pendente · aguardando primeiro acesso", "Cancelar convite", async () => {
        await cancelInvite(i.email);
        notify(`Convite de ${i.email} cancelado.`, false, accessMessage);
      }),
    );
}
document.querySelector("#show-access").addEventListener("click", async () => {
  panel.hidden = true;
  accessPanel.hidden = false;
  accessMessage.textContent = "";
  try {
    await renderAccess();
  } catch (err) {
    notify(err.message, true, accessMessage);
  }
});
document.querySelector("#close-access").addEventListener("click", () => {
  accessPanel.hidden = true;
  panel.hidden = false;
});
document.querySelector("#invite-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.querySelector("#invite-email");
  const button = e.target.querySelector("button");
  button.disabled = true;
  try {
    const result = await inviteAdmin(input.value);
    notify(
      result === "ativo"
        ? `${input.value} já tinha conta e agora tem acesso ao painel.`
        : `Convite registrado para ${input.value}. Peça para a pessoa fazer o primeiro acesso nesta página.`,
      false,
      accessMessage,
    );
    input.value = "";
    await renderAccess();
  } catch (err) {
    notify(err.message, true, accessMessage);
  } finally {
    button.disabled = false;
  }
});
