import { mkdir, copyFile, writeFile, rm } from "node:fs/promises";
const files = [
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
];
const apiUrl = process.env.PUBLIC_API_URL || "";
if (apiUrl && !/^https:\/\/[^\s]+$/.test(apiUrl))
  throw new Error("PUBLIC_API_URL precisa usar HTTPS.");
if (process.env.VERCEL_ENV === "production" && !apiUrl)
  throw new Error(
    "Produção exige API configurada; catálogo demonstrativo não pode ir ao domínio.",
  );
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const file of files) await copyFile(file, `dist/${file}`);
await writeFile(
  "dist/config.js",
  `window.URYU_CONFIG = ${JSON.stringify({ apiUrl: apiUrl.replace(/\/$/, ""), demo: !apiUrl })};\n`,
);
console.log(
  `Site preparado em dist (${apiUrl ? "API configurada" : "prévia demonstrativa"}).`,
);
