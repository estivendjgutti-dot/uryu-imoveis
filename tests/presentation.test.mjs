import { test } from "node:test";
import assert from "node:assert/strict";
import { examples } from "../presentation/properties.mjs";
import { validateProperty } from "../validation.js";
test("os 12 exemplos têm tipos distintos, avisos públicos e duas imagens", () => {
  assert.equal(examples.length,12);
  assert.equal(new Set(examples.map(x=>x.categoria)).size,12);
  for(const example of examples) {
    const valid=validateProperty({...example,fotos:["12345678-1234-1234-1234-123456789abc.webp"]});
    assert.equal(valid.demonstrativo,true);
    assert.match(valid.descricao,/Não representa uma oferta real/);
    assert.match(valid.titulo,/^DEMO/);
    assert.equal(example.images.length,2);
  }
});
