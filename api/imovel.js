import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderPropertyPage, renderNotFound } from "./_seo.js";

const base = (process.env.PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.PUBLIC_SUPABASE_ANON_KEY || "";
const template = () => readFile(join(process.cwd(), "imovel.html"), "utf8");

async function load(id) {
  const res = await fetch(
    `${base}/rest/v1/properties?select=id,codigo,status,payload,created_at,updated_at&status=eq.publicado&id=eq.${id}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error("db " + res.status);
  const rows = await res.json();
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r.payload, id: r.id, codigo: r.codigo, status: r.status, created_at: r.created_at, updated_at: r.updated_at };
}

// Preview deployments must never be indexed.
const forEnv = (html) =>
  process.env.VERCEL_ENV === "preview" ? html.replace("<head>", '<head>\n    <meta name="robots" content="noindex, nofollow" />') : html;

export default async function handler(req, res) {
  const id = String(req.query.id || "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const html = await template();
  if (!base) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(forEnv(html));
  }
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    res.setHeader("Cache-Control", "public, s-maxage=60");
    return res.status(404).send(forEnv(renderNotFound(html)));
  }
  try {
    const p = await load(id);
    if (!p) {
      res.setHeader("Cache-Control", "public, s-maxage=60");
      return res.status(404).send(forEnv(renderNotFound(html)));
    }
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return res.status(200).send(forEnv(renderPropertyPage(html, p, base)));
  } catch {
    // Database hiccup: serve the plain page so visitors still get the listing via client-side JS.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(forEnv(html.replace(/\r?\n?[ \t]*<script src="imoveis.js"><\/script>/, "")));
  }
}
