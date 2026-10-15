import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { examples } from "../presentation/properties.mjs";
const base="https://api-preview.uryuimoveis.com.br";
const account=JSON.parse(await readFile("tmp/owner-preview.json","utf8"));
let token="";
async function api(path, options={}) {
  const headers={...options.headers};
  if(token) headers.Authorization=`Bearer ${token}`;
  if(options.body && !(options.body instanceof FormData)) headers["Content-Type"]="application/json";
  const r=await fetch(base+"/api"+path,{...options,headers,signal:AbortSignal.timeout(60000)});
  const data=await r.json();
  if(!r.ok) throw new Error(`${r.status}: ${data.error || "API recusou operação"}`);
  return data;
}
if((await api("/health")).environment!=="preview") throw new Error("Recusado: ambiente não é Preview.");
token=(await api("/login",{method:"POST",body:JSON.stringify(account)})).token;
let uploads={};
try { uploads=JSON.parse(await readFile("tmp/demo-uploads.json","utf8")); } catch(e) { if(e.code!=="ENOENT") throw e; }
async function upload(name) {
  const buffer=await readFile(`assets/demo/${name}`);
  const hash=createHash("sha256").update(buffer).digest("hex");
  if(uploads[name]?.hash===hash) {
    const r=await fetch(base+"/api/admin/media/"+uploads[name].filename,{headers:{Authorization:`Bearer ${token}`}});
    if(r.ok) return uploads[name].filename;
  }
  const form=new FormData(); form.append("photo",new Blob([buffer],{type:"image/png"}),name);
  const {filename}=await api("/admin/media",{method:"POST",body:form});
  uploads[name]={filename,hash};
  await writeFile("tmp/demo-uploads.json",JSON.stringify(uploads,null,2));
  return filename;
}
if(process.argv.includes("--first-image")) { console.log(JSON.stringify({image:await upload("01-ext.png")})); process.exit(0); }
const limit=Number(process.argv.find(a=>a.startsWith("--limit="))?.split("=")[1]||examples.length);
const existing=await api("/admin/properties");
const output=[];
for(const example of examples.slice(0,limit)) {
  const current=existing.find(p=>p.codigo===example.codigo);
  if(current && !current.demonstrativo) throw new Error("Código já pertence a um cadastro não demonstrativo.");
  const {images,...payload}=example;
  payload.fotos=[];
  for(const name of images) payload.fotos.push(await upload(name));
  const saved=await api("/admin/properties"+(current?"/"+current.id:""),{method:current?"PUT":"POST",body:JSON.stringify(payload)});
  output.push({id:saved.id,codigo:saved.codigo,categoria:saved.categoria,photos:saved.fotos.length});
  console.log(`${saved.codigo}: ${saved.categoria}, ${saved.fotos.length} imagens, demonstrativo`);
}
await writeFile("presentation/seed-result.json",JSON.stringify(output,null,2));
