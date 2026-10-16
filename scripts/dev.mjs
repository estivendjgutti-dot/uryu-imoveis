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
  "logo-uryu.png",
  "empresa-foto.png",
  "background.mp4",
  "background-mobile.webp",
  "background-poster.webp",
]);
app.get("/theme.css", (_req,res)=>res.sendFile(resolve("tmp/theme.css")));
app.get("/empresa-foto.webp", (_req,res)=>res.sendFile(resolve("tmp/empresa-foto.webp")));
app.get("/config.js", (_req, res) =>
  res
    .type("js")
    .send(
      `window.URYU_CONFIG=${JSON.stringify({ apiUrl: process.env.PUBLIC_API_URL || "", demo: !process.env.PUBLIC_API_URL })};`,
    ),
);
app.get("/{*path}", (req, res) => {
  const name = req.path === "/" ? "index.html" : req.path.slice(1);
  if (!allowed.has(name)) return res.sendStatus(404);
  res.sendFile(resolve(name));
});
app.listen(4287, "127.0.0.1", () =>
  console.log("Prévia: http://127.0.0.1:4287"),
);
