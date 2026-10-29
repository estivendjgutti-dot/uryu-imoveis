// Weekly audit: keeps the free Supabase project active, checks the live site and saves a local backup.
// Usage: node scripts/backup.mjs [destino]   (default U:\Uryu-imoveis)
import { mkdir, writeFile, readFile, readdir, rm, appendFile, access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const SITE = "https://uryuimoveis.com.br";
const DB = "https://gzbhynwdrtyjatklipnj.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ymh5bndkcnR5amF0a2xpcG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMDc3ODUsImV4cCI6MjEwODg4Mzc4NX0.tENQ7nAQvtv8dfoGVKGpp_5YAz_HTQOau87hvatbf5c";
const KEEP = 12;
const dest = process.argv[2] || "U:\\Uryu-imoveis";
const today = new Date().toISOString().slice(0, 10);
const log = (msg) => appendFile(join(dest, "auditoria.log"), `${new Date().toISOString()}  ${msg}\n`);

async function serviceKey() {
  try {
    const key = (await readFile(join(homedir(), ".uryu", "service-key.txt"), "utf8")).trim();
    return key.startsWith("eyJ") || key.startsWith("sb_secret_") ? key : "";
  } catch {
    return "";
  }
}

async function get(path, key, asJson = true) {
  const r = await fetch(DB + path, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
  return asJson ? r.json() : Buffer.from(await r.arrayBuffer());
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

await mkdir(join(dest, "backups"), { recursive: true });
await mkdir(join(dest, "fotos"), { recursive: true });
const problems = [];

const site = await fetch(SITE, { signal: AbortSignal.timeout(30000) }).catch((e) => ({ ok: false, status: e.message }));
if (!site.ok) problems.push(`site fora do ar (${site.status})`);

const key = await serviceKey();
const mode = key ? "completo" : "público";
const folder = join(dest, "backups", today);
await mkdir(folder, { recursive: true });

let properties = [];
try {
  properties = key
    ? await get("/rest/v1/properties?select=*&order=codigo", key)
    : await get("/rest/v1/properties?select=id,codigo,status,payload,created_at,updated_at&order=codigo", ANON);
  await writeFile(join(folder, "imoveis.json"), JSON.stringify(properties, null, 2));
  if (key) await writeFile(join(folder, "admins.json"), JSON.stringify(await get("/rest/v1/admins?select=*", key), null, 2));
} catch (e) {
  problems.push(`banco: ${e.message}`);
}

let names = properties.flatMap((p) => p.payload?.fotos || []);
if (key) {
  try {
    const r = await fetch(DB + "/storage/v1/object/list/fotos", {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 10000 }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    names = [...new Set([...names, ...(await r.json()).map((o) => o.name)])];
  } catch (e) {
    problems.push(`lista de fotos: ${e.message}`);
  }
}
let downloaded = 0;
for (const name of new Set(names)) {
  if (!/^[a-f0-9-]{36}\.(webp|jpg)$/.test(name) || (await exists(join(dest, "fotos", name)))) continue;
  try {
    await writeFile(join(dest, "fotos", name), await get(`/storage/v1/object/public/fotos/${name}`, ANON, false));
    downloaded++;
  } catch (e) {
    problems.push(`foto ${name}: ${e.message}`);
  }
}

const old = (await readdir(join(dest, "backups"))).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse().slice(KEEP);
for (const d of old) await rm(join(dest, "backups", d), { recursive: true, force: true });

const published = properties.filter((p) => p.status === "publicado").length;
const summary = `backup ${mode}: ${properties.length} imóveis (${published} publicados), ${downloaded} fotos novas` +
  (key ? "" : " · sem chave de serviço: rascunhos e notas internas não entram") +
  (problems.length ? ` · PROBLEMAS: ${problems.join("; ")}` : " · tudo ok");
await log(summary);
console.log(summary);
process.exitCode = problems.length ? 1 : 0;
