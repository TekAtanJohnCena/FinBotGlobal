import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc:gcm:v1";
const IV_LENGTH = 12;

function getKeyMaterial() {
  const rawKey = process.env.CARD_TOKEN_ENCRYPTION_KEY || process.env.SECRET_KEY;
  if (!rawKey) {
    throw new Error("CARD_TOKEN_ENCRYPTION_KEY or SECRET_KEY must be set for card token encryption.");
  }

  // Always derive exactly 32 bytes for AES-256.
  return crypto.createHash("sha256").update(String(rawKey), "utf8").digest();
}

export function encryptSensitiveValue(value) {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value !== "string") return value;
  if (value.startsWith(`${ENCRYPTION_PREFIX}:`)) return value;

  const key = getKeyMaterial();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSensitiveValue(value) {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value !== "string") return value;
  if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) return value;

  const parts = value.split(":");
  if (parts.length !== 6) {
    return value;
  }

  const iv = Buffer.from(parts[3], "base64");
  const authTag = Buffer.from(parts[4], "base64");
  const encrypted = Buffer.from(parts[5], "base64");

  try {
    const key = getKeyMaterial();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return value;
  }
}

