import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { watermarkPhoto } from "../server/photos.mjs";

test("upload grava WebP com marca na imagem e mantém proporção", async () => {
  const source = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#a0a0a0" } }).png().toBuffer();
  const output = await watermarkPhoto(source);
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 800);
  assert.equal(meta.height, 600);
  const stamped = await sharp(output).extract({ left: 520, top: 550, width: 250, height: 30 }).stats();
  assert.ok(stamped.channels[0].stdev > 10, "marca deve alterar os pixels na área de assinatura");
});

test("upload inválido é recusado antes de salvar", async () => {
  await assert.rejects(watermarkPhoto(Buffer.from("não é imagem")));
});
