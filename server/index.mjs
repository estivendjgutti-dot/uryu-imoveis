import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import pg from "pg";
import { randomUUID, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPassword, issueToken, verifyToken } from "./auth.mjs";
import { validateProperty, statuses } from "./validation.mjs";
const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET } =
  process.env;
if (
  !DATABASE_URL ||
  !ADMIN_EMAIL ||
  !ADMIN_PASSWORD_HASH ||
  !SESSION_SECRET ||
  SESSION_SECRET.length < 32
)
  throw new Error(
    "Configure DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH e SESSION_SECRET (32+ caracteres).",
  );
const secret = createHmac("sha256", SESSION_SECRET)
  .update(ADMIN_PASSWORD_HASH)
  .digest("hex");
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  ssl:
    process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
});
await pool.query(
  await readFile(
    resolve(dirname(fileURLToPath(import.meta.url)), "schema.sql"),
    "utf8",
  ),
);
const mediaDir = resolve(process.env.MEDIA_DIR || "uploads");
await mkdir(mediaDir, { recursive: true });
const app = express();
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowed = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    if (!allowed.has(origin))
      return res.status(403).json({ error: "Origem não autorizada." });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, OPTIONS",
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "256kb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas requisições. Aguarde um minuto." },
  }),
);
const admin = (req, res, next) => {
  if (
    !verifyToken(
      (req.headers.authorization || "").replace(/^Bearer /, ""),
      secret,
    )
  )
    return res.status(401).json({ error: "Entre novamente no painel." });
  next();
};
const uuid = (id) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const publicRow = (row) => ({
  ...row.payload,
  id: row.id,
  codigo: row.codigo,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
});
app.get("/api/health", async (_req, res) => {
  await pool.query("select 1");
  res.json({ ok: true, environment: process.env.APP_ENV || "preview" });
});
app.post(
  "/api/login",
  rateLimit({
    windowMs: 15 * 60000,
    limit: 8,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas tentativas. Aguarde 15 minutos." },
  }),
  (req, res) => {
    const { email, password } = req.body || {};
    const valid =
      typeof password === "string" &&
      password.length <= 256 &&
      checkPassword(password, ADMIN_PASSWORD_HASH);
    if (email !== ADMIN_EMAIL || !valid)
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    res.json({ token: issueToken(secret), expiresIn: 28800 });
  },
);
app.get("/api/properties", async (_req, res) => {
  const { rows } = await pool.query(
    "select id,codigo,status,payload,created_at,updated_at from properties where status='publicado' order by created_at desc limit 1000",
  );
  res.json(rows.map(publicRow));
});
app.get("/api/properties/:id", async (req, res) => {
  if (!uuid(req.params.id))
    return res.status(404).json({ error: "Imóvel indisponível." });
  const { rows } = await pool.query(
    "select id,codigo,status,payload,created_at,updated_at from properties where id=$1 and status='publicado'",
    [req.params.id],
  );
  if (!rows.length)
    return res.status(404).json({ error: "Imóvel indisponível." });
  res.json(publicRow(rows[0]));
});
app.get("/api/admin/properties", admin, async (_req, res) => {
  const { rows } = await pool.query(
    "select * from properties order by updated_at desc",
  );
  res.json(
    rows.map((row) => ({
      ...publicRow(row),
      private_notes: row.private_notes,
    })),
  );
});
async function save(req, res) {
  let property;
  try {
    property = validateProperty(req.body);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const notes = req.body.private_notes || "";
  if (typeof notes !== "string" || notes.length > 10000)
    return res.status(400).json({ error: "Notas privadas inválidas." });
  const files = property.fotos.filter((f) => !f.startsWith("https://"));
  if (files.length) {
    const found = await pool.query(
      "select filename from media where filename=any($1::text[])",
      [files],
    );
    if (found.rows.length !== files.length)
      return res
        .status(400)
        .json({ error: "Uma das fotos não foi enviada ao servidor." });
  }
  let result;
  if (req.params.id) {
    if (!uuid(req.params.id)) return res.sendStatus(404);
    result = await pool.query(
      "update properties set codigo=$1,status=$2,payload=$3,private_notes=$4,updated_at=now() where id=$5 returning *",
      [
        property.codigo,
        property.status,
        JSON.stringify(property),
        notes,
        req.params.id,
      ],
    );
  } else {
    result = await pool.query(
      "insert into properties(id,codigo,status,payload,private_notes) values($1,$2,$3,$4,$5) returning *",
      [
        randomUUID(),
        property.codigo,
        property.status,
        JSON.stringify(property),
        notes,
      ],
    );
  }
  if (!result.rows.length)
    return res.status(404).json({ error: "Imóvel não encontrado." });
  res
    .status(req.params.id ? 200 : 201)
    .json({ ...publicRow(result.rows[0]), private_notes: notes });
}
app.post("/api/admin/properties", admin, save);
app.put("/api/admin/properties/:id", admin, save);
app.patch("/api/admin/properties/:id/status", admin, async (req, res) => {
  if (!uuid(req.params.id) || !statuses.includes(req.body.status))
    return res.status(400).json({ error: "Estado inválido." });
  const current = await pool.query("select * from properties where id=$1", [
    req.params.id,
  ]);
  if (!current.rows.length) return res.sendStatus(404);
  try {
    validateProperty({ ...current.rows[0].payload, status: req.body.status });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  await pool.query(
    "update properties set status=$1,updated_at=now() where id=$2",
    [req.body.status, req.params.id],
  );
  res.json({ ok: true });
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});
app.post(
  "/api/admin/media",
  admin,
  rateLimit({ windowMs: 60000, limit: 30 }),
  upload.single("photo"),
  async (req, res) => {
    if (!req.file)
      return res
        .status(400)
        .json({ error: "Envie uma foto JPG, PNG ou WebP de até 12 MB." });
    let buffer;
    try {
      buffer = await sharp(req.file.buffer, { limitInputPixels: 40000000 })
        .rotate()
        .resize({
          width: 2400,
          height: 2400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return res
        .status(400)
        .json({
          error: "A imagem está inválida ou excede o limite de resolução.",
        });
    }
    const filename = randomUUID() + ".webp";
    await writeFile(resolve(mediaDir, filename), buffer);
    try {
      await pool.query("insert into media(filename) values($1)", [filename]);
    } catch (e) {
      await unlink(resolve(mediaDir, filename));
      throw e;
    }
    res.status(201).json({ filename });
  },
);
async function sendMedia(req, res, privateAccess) {
  const filename = req.params.filename;
  if (!/^[a-f0-9-]{36}\.webp$/.test(filename)) return res.sendStatus(404);
  const query = privateAccess
    ? "select filename from media where filename=$1"
    : "select filename from media where filename=$1 and exists(select 1 from properties where status='publicado' and payload->'fotos' ? $1)";
  const { rows } = await pool.query(query, [filename]);
  if (!rows.length) return res.sendStatus(404);
  res.type("webp").sendFile(resolve(mediaDir, filename));
}
app.get("/api/media/:filename", (req, res) => sendMedia(req, res, false));
app.get("/api/admin/media/:filename", admin, (req, res) =>
  sendMedia(req, res, true),
);
app.use((err, _req, res, _next) => {
  if (err.code === "23505")
    return res
      .status(409)
      .json({ error: "Já existe um imóvel com esse código." });
  if (err instanceof multer.MulterError)
    return res
      .status(400)
      .json({ error: "Envie uma foto por vez, com até 12 MB." });
  console.error("Falha na API:", err.code || err.name);
  res
    .status(500)
    .json({ error: "Não foi possível concluir a operação. Tente novamente." });
});
const server = app.listen(
  Number(process.env.PORT) || 3001,
  process.env.HOST || "0.0.0.0",
  () => console.log("API Uryu iniciada."),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
