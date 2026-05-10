import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(size = 21): string {
  const bytes = crypto.randomBytes(size);
  return Array.from(bytes)
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join("");
}
