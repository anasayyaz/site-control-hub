import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ACCESS_SEED = "QmPz!)@(1029";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secretsPath = path.join(__dirname, "..", "src", "secrets.js");

const uri = process.argv[2];
if (!uri?.startsWith("mongodb")) {
  console.error("Usage: node tools/reencode-mongo-uri.mjs \"mongodb+srv://...\"");
  process.exit(1);
}

const bytes = Buffer.from(uri, "utf8");
const key = Buffer.from(ACCESS_SEED, "utf8");
const out = Buffer.alloc(bytes.length);
for (let i = 0; i < bytes.length; i++) {
  out[i] = bytes[i] ^ key[i % key.length];
}
const cipher = out.toString("base64");

let src = readFileSync(secretsPath, "utf8");
src = src.replace(
  /export const MONGO_CIPHER =\s*\n\s*"[^"]+";/,
  `export const MONGO_CIPHER =\n  "${cipher}";`
);
writeFileSync(secretsPath, src);
console.log("Updated MONGO_CIPHER in src/secrets.js");
