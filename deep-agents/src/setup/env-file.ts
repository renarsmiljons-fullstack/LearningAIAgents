import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const ENV_PATH = resolve(ROOT, ".env");
const ENV_EXAMPLE_PATH = resolve(ROOT, ".env.example");

export function parseEnvFile(content: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    vars.set(trimmed.slice(0, eqIndex), trimmed.slice(eqIndex + 1));
  }
  return vars;
}

export function isMissing(
  value: string | undefined,
  placeholders: string[],
): boolean {
  return value === undefined || placeholders.includes(value);
}

export function ensureEnvFile(): { content: string; vars: Map<string, string> } {
  if (!existsSync(ENV_PATH)) {
    if (existsSync(ENV_EXAMPLE_PATH)) {
      copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
      console.log("Created .env from .env.example\n");
    } else {
      writeFileSync(ENV_PATH, "");
      console.log("Created empty .env file\n");
    }
  }

  const content = readFileSync(ENV_PATH, "utf-8");
  return { content, vars: parseEnvFile(content) };
}

export function writeEnvVars(
  originalContent: string,
  vars: Map<string, string>,
  keys: string[],
) {
  let updatedContent = originalContent;
  for (const key of keys) {
    const value = vars.get(key);
    if (value === undefined) continue;

    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(pattern, `${key}=${value}`);
    } else {
      updatedContent = updatedContent.trimEnd() + `\n${key}=${value}\n`;
    }
  }

  writeFileSync(ENV_PATH, updatedContent);
  console.log("\n.env updated successfully.\n");
}
