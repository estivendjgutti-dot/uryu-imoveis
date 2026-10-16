import sharp from "sharp";

// Burn the brand into pixels before storage; the API never saves an unmarked original.
export async function watermarkPhoto(input) {
  const normalized = await sharp(input, { limitInputPixels: 40000000 })
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .toBuffer();
  const { width: w, height: h } = await sharp(normalized).metadata();
  const font = Math.max(8, Math.round(w * 0.018));
  const pad = Math.max(4, Math.round(w * 0.018));
  const pillW = Math.round(w * 0.36), pillH = Math.round(font * 2.6);
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g transform="rotate(-18 ${w / 2} ${h / 2})" font-family="DejaVu Sans, sans-serif" text-anchor="middle" font-weight="bold">
      <text x="${w / 2}" y="${h / 2}" font-size="${Math.round(w * 0.065)}" fill="white" fill-opacity="0.23" stroke="black" stroke-opacity="0.12" stroke-width="1">URYU IMÓVEIS</text>
    </g>
    <rect x="${w - pillW - pad}" y="${h - pillH - pad}" width="${pillW}" height="${pillH}" rx="${font / 2}" fill="#24231f" fill-opacity="0.62"/>
    <text x="${w - pillW / 2 - pad}" y="${h - pad - pillH / 2 + font * 0.35}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${font}" fill="#f6f1e9">URYU IMÓVEIS</text>
  </svg>`);
  return sharp(normalized).composite([{ input: overlay }]).webp({ quality: 85 }).toBuffer();
}
