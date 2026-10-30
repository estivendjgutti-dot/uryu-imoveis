import { mkdir, copyFile, writeFile, rm, readFile } from "node:fs/promises";
import { buildStyles } from "./styles.mjs";
import sharp from "sharp";
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
  "admin-db.js",
  "photos.js",
  "validation.js",
  "logo-uryu.png",
  "favicon.png",
  "favicon-32.png",
  "apple-touch-icon.png",
  "empresa-foto.png",
  "background.mp4",
  "intro.js",
  "intro.mp4",
  "intro-720.mp4",
  "intro-poster.jpg",
  "background-poster.webp",
  "background-mobile.webp",
];
const apiUrl = (process.env.PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || "";
if (apiUrl && !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(apiUrl))
  throw new Error("PUBLIC_SUPABASE_URL precisa ser https://<projeto>.supabase.co.");
if (apiUrl && !anonKey) throw new Error("Defina PUBLIC_SUPABASE_ANON_KEY junto com a URL.");
if (process.env.VERCEL_ENV === "production" && !apiUrl)
  throw new Error(
    "Produção exige banco configurado; catálogo demonstrativo não pode ir ao domínio.",
  );
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const file of files) await copyFile(file, `dist/${file}`);
await buildStyles();
await sharp("empresa-foto.png").resize({ width:1200, withoutEnlargement:true }).webp({quality:82}).toFile("dist/empresa-foto.webp");
if(apiUrl) for(const file of ['index.html','imovel.html']) {
  const html=await readFile('dist/'+file,'utf8');
  await writeFile('dist/'+file,html.replace('    <script src="imoveis.js"></script>',''));
}
const preview = process.env.VERCEL_ENV === "preview";
if (preview) {
  for (const file of ["index.html", "imovel.html", "admin.html"]) {
    const html = await readFile(`dist/${file}`, "utf8");
    await writeFile(`dist/${file}`, html.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow" />'));
  }
  await writeFile("dist/robots.txt", "User-agent: *\nDisallow: /\n");
}
await writeFile(
  "dist/config.js",
  `window.URYU_CONFIG = ${JSON.stringify({ supabaseUrl: apiUrl, supabaseKey: anonKey, demo: !apiUrl })};\n`,
);
console.log(
  `Site preparado em dist (${apiUrl ? "banco configurado" : "prévia demonstrativa"}).`,
);
