// Run inside the API container; accepts a JSON account on stdin. Never logs secrets.
import pg from "pg";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./auth.mjs";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const { email, name, password } = JSON.parse(input);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "") ||
    typeof name !== "string" || !name.trim() ||
    typeof password !== "string" || password.length < 16 || password.length > 256)
  throw new Error("Revise nome, e-mail e senha (16+ caracteres).");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query(
    "insert into admin_users(id,name,email,password_hash,session_version) values($1,$2,$3,$4,$5) on conflict(email) do nothing returning id",
    [randomUUID(), name.trim(), email.trim().toLowerCase(), hashPassword(password), randomUUID()],
  );
  console.log(JSON.stringify({ email, created: result.rowCount === 1 }));
} finally { await pool.end(); }
