import { createHash, randomBytes } from "node:crypto";

export function hash_password(input: { plaintext: string }): {
  hashed: string;
} {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + input.plaintext)
    .digest("hex");
  return { hashed: `${salt}:${hash}` };
}
