import express from "express";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { buildStyles } from "./styles.mjs";
import sharp from "sharp";
await mkdir("tmp",{recursive:true});
await buildStyles("tmp/theme.css");
await sharp("empresa-foto.png").resize({width:1200,withoutEnlargement:true}).webp({quality:82}).toFile("tmp/empresa-foto.webp");
const app = express();
const allowed = new Set([
  "index.html",
  "imoveis.js",
  "site.css",
  "app.js",
  "data.js",
  "catalog-i18n.js",
  "video-scroll.js",
  "imovel.html",
  "imovel.js",
  "admin.html",
  "admin.js",
  "admin-db.js",
  "photos.js",
  "validation.js",
  "logo-uryu.png",
  "empresa-foto.png",
  "background.mp4",
  "intro.js",
  "og-image.jpg",
  "robots.txt",
  "sitemap.xml",
  "intro.mp4",
  "intro-720.mp4",
  "intro-poster.jpg",
  "favicon.png",
  "favicon-32.png",
  "apple-touch-icon.png",
  "background-mobile.webp",
  "background-poster.webp",
]);
app.get("/theme.css", (_req,res)=>res.sendFile(resolve("tmp/theme.css")));
app.get("/empresa-foto.webp", (_req,res)=>res.sendFile(resolve("tmp/empresa-foto.webp")));
app.get("/config.js", (_req, res) =>
  res
    .type("js")
    .send(
      `window.URYU_CONFIG=${JSON.stringify({ supabaseUrl: process.env.PUBLIC_SUPABASE_URL || "", supabaseKey: process.env.PUBLIC_SUPABASE_ANON_KEY || "", demo: !process.env.PUBLIC_SUPABASE_URL })};`,
    ),
);
app.get("/{*path}", (req, res) => {
  const name = req.path === "/" ? "index.html" : req.path === "/imovel" ? "imovel.html" : req.path.slice(1);
  if (!allowed.has(name)) return res.sendStatus(404);
  res.sendFile(resolve(name));
});
app.listen(4287, "127.0.0.1", () =>
  console.log("Prévia: http://127.0.0.1:4287"),
);
