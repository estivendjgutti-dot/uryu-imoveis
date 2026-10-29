import { mkdir, writeFile, stat } from "node:fs/promises";
const origin="https://uryuimoveis.com.br";
const routes=[];
let html="";
for(const path of ["/","/robots.txt","/sitemap.xml","/admin","/imovel?id=inexistente"]) {
  const start=performance.now();
  const r=await fetch(origin+path,{signal:AbortSignal.timeout(25000)});
  const body=await r.text();
  if(path==="/") html=body;
  routes.push({path,status:r.status,finalUrl:r.url,ms:Math.round(performance.now()-start),bytes:Buffer.byteLength(body),contentType:r.headers.get("content-type"),xRobotsTag:r.headers.get("x-robots-tag")});
}
const www=await fetch("https://www.uryuimoveis.com.br/",{redirect:"manual"});
const properties=await (await fetch("https://api.uryuimoveis.com.br/api/properties")).json();
const evidence={checkedAt:new Date().toISOString(),origin,routes,www:{status:www.status,redirect:www.headers.get("location")},
  html:{title:html.match(/<title>(.*?)<\/title>/s)?.[1],description:html.match(/name="description"\s+content="([^"]+)/)?.[1],h1Count:(html.match(/<h1\b/g)||[]).length,canonical:/rel=["']canonical/.test(html),openGraph:/property=["']og:/.test(html),structuredData:/application\/ld\+json/.test(html),hreflang:/hreflang=/.test(html),privacy:/privacidade|privacy/i.test(html),creci:/creci/i.test(html),tailwindRuntime:/cdn.tailwindcss.com/.test(html),sampleDataScript:/src="imoveis.js"/.test(html)},
  productionListings:properties.length,videoLocalBytes:(await stat("background.mp4")).size,
  limits:["Não foi acessado Search Console ou Google Business Profile.","Não foi medida pontuação Lighthouse ou métricas reais de usuários.","HTTP 200 na ficha inválida é evidência de potencial soft 404, não confirmação do relatório do Google."]};
await mkdir("reports",{recursive:true});
await writeFile("reports/site-audit-evidence.json",JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
