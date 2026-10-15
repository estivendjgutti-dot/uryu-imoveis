import { mkdir, copyFile, writeFile, rm, readFile } from "node:fs/promises";
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
  "background-poster.webp",
  "background-mobile.webp",
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
const preview = process.env.VERCEL_ENV === "preview" || apiUrl.includes("api-preview.");
if (preview) {
  for (const file of ["index.html", "imovel.html", "admin.html"]) {
    const html = await readFile(`dist/${file}`, "utf8");
    await writeFile(`dist/${file}`, html.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow" />'));
  }
  await writeFile("dist/robots.txt", "User-agent: *\nDisallow: /\n");
}
await writeFile(
  "dist/config.js",
  `window.URYU_CONFIG = ${JSON.stringify({ apiUrl: apiUrl.replace(/\/$/, ""), demo: !apiUrl })};\n`,
);
console.log(
  `Site preparado em dist (${apiUrl ? "API configurada" : "prévia demonstrativa"}).`,
);
