import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "../..");
let loaded = false;

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator === -1) {
        return null;
      }
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return [key, value];
    })
    .filter(Boolean);
}

export function loadEnvFiles() {
  if (loaded) {
    return;
  }

  const candidates = [".env", ".env.local"].map((name) => path.join(projectRoot, name));
  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue;
    }
    const pairs = parseEnvFile(readFileSync(filePath, "utf8"));
    for (const [key, value] of pairs) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }

  loaded = true;
}
