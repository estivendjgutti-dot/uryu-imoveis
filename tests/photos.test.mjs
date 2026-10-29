import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProperty } from "../validation.js";
import { examples } from "../presentation/properties.mjs";

test("URL externa não contorna a marca d’água do upload", () => {
  assert.throws(() => validateProperty({ ...examples[0], fotos: ["https://images.unsplash.com/photo-ficticia"] }), /marca d’água/);
});
test("fotos do bucket aceitam WebP e JPEG com nome UUID", () => {
  const base = { ...examples[0], status: "rascunho" };
  for (const name of ["12345678-1234-1234-1234-123456789abc.webp", "12345678-1234-1234-1234-123456789abc.jpg"])
    assert.doesNotThrow(() => validateProperty({ ...base, fotos: [name] }));
  assert.throws(() => validateProperty({ ...base, fotos: ["../segredo.webp"] }));
});
