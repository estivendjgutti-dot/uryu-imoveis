import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import sharp from "sharp";
const root = process.env.SMOKE_API || "http://127.0.0.1:3001/api";
const password = await readFile("/tmp/setup-password", "utf8");
const req = async (path, options = {}) => {
  const response = await fetch(root + path, options);
  return { response, data: await response.json().catch(() => null) };
};
assert.equal((await req("/health")).response.status, 200);
assert.equal((await req("/admin/properties")).response.status, 401);
const login = await req("/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@uryuimoveis.com.br", password }),
});
assert.equal(login.response.status, 200);
const auth = { Authorization: "Bearer " + login.data.token };
const png = await sharp({
  create: { width: 20, height: 20, channels: 3, background: "#899477" },
})
  .png()
  .toBuffer();
const form = new FormData();
form.append("photo", new Blob([png], { type: "image/png" }), "teste.png");
const upload = await req("/admin/media", {
  method: "POST",
  headers: auth,
  body: form,
});
assert.equal(upload.response.status, 201);
const filename = upload.data.filename;
assert.equal((await fetch(root + "/media/" + filename)).status, 404);
const body = {
  titulo: "Teste técnico de cadastro",
  codigo: "QA-" + Date.now(),
  estado: "SP",
  cidade: "Osasco",
  bairro: "Centro",
  descricao: "Registro temporário para verificar a API.",
  categoria: "casa",
  negociacao: "venda",
  fase: "pronto",
  status: "rascunho",
  preco: 100000,
  tamanho: 100,
  quartos: 2,
  banheiros: 1,
  vagas: 1,
  condominio: 0,
  iptu: 0,
  destaque: false,
  fotos: [filename],
  caracteristicas: ["Varanda"],
  private_notes: "NOTA PRIVADA DE TESTE",
};
const created = await req("/admin/properties", {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
assert.equal(created.response.status, 201);
const id = created.data.id;
try {
  assert.equal((await req("/properties/" + id)).response.status, 404);
  const published = await req("/admin/properties/" + id, {
    method: "PUT",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, status: "publicado" }),
  });
  assert.equal(published.response.status, 200);
  const visible = await req("/properties/" + id);
  assert.equal(visible.response.status, 200);
  assert.equal("private_notes" in visible.data, false);
  assert.equal((await fetch(root + "/media/" + filename)).status, 200);
  const archived = await req("/admin/properties/" + id + "/status", {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "arquivado" }),
  });
  assert.equal(archived.response.status, 200);
  assert.equal((await req("/properties/" + id)).response.status, 404);
  assert.equal((await fetch(root + "/media/" + filename)).status, 404);
  console.log(
    "PASS: login, CRUD PostgreSQL, upload, publicação, arquivamento e privacidade de notas/fotos.",
  );
} finally {
  // Only the identified disposable QA record is removed; no customer data is touched.
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("delete from properties where id=$1 and codigo=$2", [
    id,
    body.codigo,
  ]);
  await pool.query("delete from media where filename=$1", [filename]);
  await unlink((process.env.MEDIA_DIR || "/app/uploads") + "/" + filename);
  await pool.end();
}
