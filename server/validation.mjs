const categories = ["apartamento", "casa", "comercial", "terreno"],
  purposes = ["venda", "aluguel"],
  phases = ["pronto", "obras", "planta"];
export const statuses = [
  "rascunho",
  "publicado",
  "reservado",
  "vendido",
  "alugado",
  "arquivado",
];
export function validateProperty(input) {
  const out = {};
  for (const [key, max] of [
    ["titulo", 150],
    ["codigo", 30],
    ["estado", 2],
    ["cidade", 100],
    ["bairro", 100],
    ["descricao", 10000],
  ]) {
    if (typeof input[key] !== "string" || input[key].trim().length > max)
      throw new Error(`Revise o campo ${key}.`);
    out[key] = input[key].trim();
  }
  for (const key of ["titulo", "codigo", "cidade", "bairro"])
    if (!out[key]) throw new Error(`Preencha ${key}.`);
  out.estado = out.estado.toUpperCase();
  if (
    ![
      "AC",
      "AL",
      "AP",
      "AM",
      "BA",
      "CE",
      "DF",
      "ES",
      "GO",
      "MA",
      "MT",
      "MS",
      "MG",
      "PA",
      "PB",
      "PR",
      "PE",
      "PI",
      "RJ",
      "RN",
      "RS",
      "RO",
      "RR",
      "SC",
      "SP",
      "SE",
      "TO",
    ].includes(out.estado)
  )
    throw new Error("Estado inválido.");
  if (!/^[A-Za-z0-9-]+$/.test(out.codigo))
    throw new Error("Código deve conter letras, números ou hífen.");
  for (const [key, values] of [
    ["categoria", categories],
    ["negociacao", purposes],
    ["fase", phases],
    ["status", statuses],
  ]) {
    if (!values.includes(input[key])) throw new Error(`Revise ${key}.`);
    out[key] = input[key];
  }
  for (const key of [
    "preco",
    "tamanho",
    "quartos",
    "banheiros",
    "vagas",
    "condominio",
    "iptu",
  ]) {
    const n = Number(input[key]);
    if (
      input[key] === null ||
      input[key] === "" ||
      !Number.isFinite(n) ||
      n < 0 ||
      n > 1e12
    )
      throw new Error(`Número inválido em ${key}.`);
    if (
      ["quartos", "banheiros", "vagas"].includes(key) &&
      (!Number.isInteger(n) || n > 100)
    )
      throw new Error(`Revise ${key}.`);
    out[key] = n;
  }
  if (out.preco <= 0 || out.tamanho <= 0)
    throw new Error("Preço e área devem ser maiores que zero.");
  out.destaque = input.destaque === true;
  if (
    !Array.isArray(input.fotos) ||
    input.fotos.length > 30 ||
    input.fotos.some(
      (p) =>
        typeof p !== "string" ||
        !(
          /^[a-f0-9-]{36}\.webp$/.test(p) ||
          /^https:\/\/images\.unsplash\.com\//.test(p)
        ),
    )
  )
    throw new Error("Fotos inválidas.");
  out.fotos = [...new Set(input.fotos)];
  if (
    !Array.isArray(input.caracteristicas) ||
    input.caracteristicas.length > 30 ||
    input.caracteristicas.some((x) => typeof x !== "string" || x.length > 100)
  )
    throw new Error("Características inválidas.");
  out.caracteristicas = input.caracteristicas
    .map((x) => x.trim())
    .filter(Boolean);
  if (out.status === "publicado" && (!out.descricao || !out.fotos.length))
    throw new Error("Para publicar, informe descrição e ao menos uma foto.");
  return out;
}
