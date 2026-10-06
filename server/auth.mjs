import {
  scryptSync,
  timingSafeEqual,
  createHmac,
  randomBytes,
} from "node:crypto";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function checkPassword(password, hash) {
  try {
    const [salt, digest] = hash.split(":");
    if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(digest))
      return false;
    return timingSafeEqual(
      scryptSync(password, salt, 64),
      Buffer.from(digest, "hex"),
    );
  } catch {
    return false;
  }
}
export function issueToken(secret, now = Date.now()) {
  const body = Buffer.from(
    JSON.stringify({ role: "admin", exp: Math.floor(now / 1000) + 28800 }),
  ).toString("base64url");
  return (
    body + "." + createHmac("sha256", secret).update(body).digest("base64url")
  );
}
export function verifyToken(token, secret, now = Date.now()) {
  try {
    const [body, sig, ...rest] = token.split(".");
    if (rest.length || !body || !sig) return false;
    const expected = createHmac("sha256", secret).update(body).digest();
    const actual = Buffer.from(sig, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      return false;
    const parsed = JSON.parse(Buffer.from(body, "base64url"));
    return (
      parsed.role === "admin" &&
      Number.isFinite(parsed.exp) &&
      parsed.exp > Math.floor(now / 1000)
    );
  } catch {
    return false;
  }
}
