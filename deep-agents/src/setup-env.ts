import { createInterface } from "readline/promises";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");
const ENV_EXAMPLE_PATH = resolve(ROOT, ".env.example");

interface EnvVar {
  key: string;
  prompt: string;
  defaultValue?: string;
  placeholders: string[];
}

const REQUIRED_VARS: EnvVar[] = [
  {
    key: "OPENAI_API_KEY",
    prompt: "Enter your OpenAI API key",
    placeholders: ["your-openai-api-key", ""],
  },
  {
    key: "POSTGRES_URL",
    prompt: "Enter your Postgres connection URL",
    defaultValue: "postgresql://postgres:postgres@localhost:5432/langgraph",
    placeholders: [""],
  },
];

function parseEnvFile(content: string): Map<string, string> {
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

function isMissing(value: string | undefined, placeholders: string[]): boolean {
  return value === undefined || placeholders.includes(value);
}

async function run() {
  if (!existsSync(ENV_PATH)) {
    if (existsSync(ENV_EXAMPLE_PATH)) {
      copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
      console.log("Created .env from .env.example\n");
    } else {
      writeFileSync(ENV_PATH, "");
      console.log("Created empty .env file\n");
    }
  }

  const envContent = readFileSync(ENV_PATH, "utf-8");
  const vars = parseEnvFile(envContent);

  const missing = REQUIRED_VARS.filter((v) =>
    isMissing(vars.get(v.key), v.placeholders),
  );

  if (missing.length === 0) return;

  console.log("Some required environment variables are not configured.\n");

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    for (const v of missing) {
      const suffix = v.defaultValue ? ` (${v.defaultValue})` : "";
      const answer = await rl.question(`${v.prompt}${suffix}: `);
      const value = answer.trim() || v.defaultValue;

      if (!value) {
        console.error(`\n${v.key} is required. Aborting.`);
        process.exit(1);
      }

      vars.set(v.key, value);
    }
  } finally {
    rl.close();
  }

  let updatedContent = envContent;
  for (const v of missing) {
    const value = vars.get(v.key)!;
    const pattern = new RegExp(`^${v.key}=.*$`, "m");

    if (pattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(pattern, `${v.key}=${value}`);
    } else {
      updatedContent = updatedContent.trimEnd() + `\n${v.key}=${value}\n`;
    }
  }

  writeFileSync(ENV_PATH, updatedContent);
  console.log("\n.env updated successfully.\n");
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
