import { createHash } from "node:crypto";

export function verify_password(input: {
  plaintext: string;
  hash: string;
}): { valid: boolean } {
  const [salt, expected] = input.hash.split(":");
  if (!salt || !expected) {
    return { valid: false };
  }
  const actual = createHash("sha256")
    .update(salt + input.plaintext)
    .digest("hex");
  return { valid: actual === expected };
}
