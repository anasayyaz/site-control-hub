/** Rotate with tools/reencode-mongo-uri.mjs */
const ACCESS_SEED = "QmPz!)@(1029";

export const MONGO_CIPHER =
  "PAI+HU5NIgNCQkQDfkIzFk5cJFteXEVWIwYjCkBKJXdVUm1MIggiQFlcEEtnf0MPIx9iTFtzN19xVEBUJB4kG0dII0REQ0ZcI0MxClJFOE1IHl9WPwo/HkMHLk1FH1FWPxkiFU12BGoOQldNIxQHCEhdJVsMREBMNEsnR0xIKkdDWUZAdwwgCm9ILU0MdEB0JB4kG0dIA0REQ0ZcIw==";

export function decodeWithSeed(cipherB64) {
  const binary = Buffer.from(cipherB64, "base64");
  const key = Buffer.from(ACCESS_SEED, "utf8");
  const out = Buffer.alloc(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary[i] ^ key[i % key.length];
  }
  return out.toString("utf8");
}
