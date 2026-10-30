import { sitemapXml } from "./_seo.js";

const base = (process.env.PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.PUBLIC_SUPABASE_ANON_KEY || "";

export default async function handler(_req, res) {
  let rows = [];
  try {
    const r = await fetch(
      `${base}/rest/v1/properties?select=id,payload,updated_at&status=eq.publicado&order=updated_at.desc&limit=1000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) },
    );
    if (r.ok) rows = await r.json();
  } catch {}
  const properties = rows.map((x) => ({ id: x.id, updated_at: x.updated_at, demonstrativo: x.payload?.demonstrativo === true }));
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(sitemapXml(properties));
}
