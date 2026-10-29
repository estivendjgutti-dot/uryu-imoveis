import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProperty } from "../validation.js";
const property = {
  titulo: "Casa teste",
  codigo: "URY-0001",
  estado: "SP",
  cidade: "Osasco",
  bairro: "Centro",
  descricao: "Descrição real",
  categoria: "casa",
  negociacao: "venda",
  fase: "pronto",
  status: "rascunho",
  preco: 100000,
  tamanho: 100,
  quartos: 2,
  banheiros: 1,
  vagas: 1,
  condominio: 0,
  iptu: 0,
  destaque: false,
  fotos: [],
  caracteristicas: [],
};
test("cadastro rejeita preço negativo, NaN e estados inválidos", () => {
  for (const change of [
    { preco: -1 },
    { tamanho: NaN },
    { estado: "XX" },
    { quartos: 1.5 },
    { status: "inventado" },
    { fotos: ["javascript:alert(1)"] },
  ])
    assert.throws(() => validateProperty({ ...property, ...change }));
});
test("publicação exige descrição e foto; notas internas não entram no anúncio", () => {
  assert.throws(() => validateProperty({ ...property, status: "publicado" }));
  const result = validateProperty({
    ...property,
    status: "publicado",
    fotos: ["12345678-1234-1234-1234-123456789abc.webp"],
    private_notes: "endereço privado",
    admin: true,
  });
  assert.equal(result.status, "publicado");
  assert.equal("private_notes" in result, false);
  assert.equal("admin" in result, false);
});
