// Burns the brand into the pixels before upload; the bucket never receives an unmarked original.
export async function watermarkPhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name}: a imagem está inválida.`);
  }
  if (bitmap.width * bitmap.height > 40000000)
    throw new Error(`${file.name}: a imagem excede o limite de resolução.`);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const family = '"Manrope", "DejaVu Sans", sans-serif';
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.font = `bold ${Math.round(w * 0.065)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.strokeText("URYU IMÓVEIS", 0, 0);
  ctx.fillStyle = "rgba(255,255,255,0.23)";
  ctx.fillText("URYU IMÓVEIS", 0, 0);
  ctx.restore();

  const font = Math.max(8, Math.round(w * 0.018));
  const pad = Math.max(4, Math.round(w * 0.018));
  const pillW = Math.round(w * 0.36), pillH = Math.round(font * 2.6);
  const x = w - pillW - pad, y = h - pillH - pad;
  ctx.fillStyle = "rgba(36,35,31,0.62)";
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, font / 2);
  ctx.fill();
  ctx.font = `bold ${font}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f6f1e9";
  ctx.fillText("URYU IMÓVEIS", x + pillW / 2, y + pillH / 2);

  const encode = (type, quality) =>
    new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode("image/webp", 0.85);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.88);
  if (!jpeg) throw new Error(`${file.name}: não foi possível processar a foto.`);
  return jpeg;
}
