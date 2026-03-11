import { createInterface, Interface } from "readline/promises";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { userInfo } from "os";

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
    defaultValue: `postgresql://${userInfo().username}@localhost:5432/langgraph`,
    placeholders: [""],
  },
];

const LANGSMITH_KEYS = {
  tracing: "LANGSMITH_TRACING",
  endpoint: "LANGSMITH_ENDPOINT",
  apiKey: "LANGSMITH_API_KEY",
  project: "LANGSMITH_PROJECT",
} as const;

const LANGSMITH_PROJECT_DEFAULT = "deep-agents";
const LANGSMITH_ENDPOINT_DEFAULT = "https://api.smith.langchain.com";
const LANGSMITH_ENDPOINT_EU = "https://eu.api.smith.langchain.com";

async function promptLangSmithTracing(
  vars: Map<string, string>,
  rl: Interface,
): Promise<boolean> {
  const tracingEnabled = vars.get(LANGSMITH_KEYS.tracing) === "true";
  const apiKey = vars.get(LANGSMITH_KEYS.apiKey);

  if (tracingEnabled && apiKey) return false;

  if (tracingEnabled && !apiKey) {
    if (!vars.has(LANGSMITH_KEYS.endpoint)) {
      const region = await rl.question(
        `LangSmith region — US or EU? (${LANGSMITH_ENDPOINT_DEFAULT}) : `,
      );
      const isEu = region.trim().toLowerCase() === "eu";
      vars.set(LANGSMITH_KEYS.endpoint, isEu ? LANGSMITH_ENDPOINT_EU : LANGSMITH_ENDPOINT_DEFAULT);
    }

    const key = await rl.question("Enter your LangSmith API key: ");
    if (!key.trim()) {
      console.error("\nLangSmith API key is required when tracing is enabled. Aborting.");
      process.exit(1);
    }
    vars.set(LANGSMITH_KEYS.apiKey, key.trim());
    vars.set(LANGSMITH_KEYS.project, vars.get(LANGSMITH_KEYS.project) ?? LANGSMITH_PROJECT_DEFAULT);
    return true;
  }

  const answer = await rl.question("Enable LangSmith tracing? (y/N): ");
  if (answer.trim().toLowerCase() !== "y") return false;

  const region = await rl.question(
    `LangSmith region — US or EU? (${LANGSMITH_ENDPOINT_DEFAULT}) : `,
  );
  const isEu = region.trim().toLowerCase() === "eu";
  const endpoint = isEu ? LANGSMITH_ENDPOINT_EU : LANGSMITH_ENDPOINT_DEFAULT;

  const key = await rl.question("Enter your LangSmith API key: ");
  if (!key.trim()) {
    console.error("\nLangSmith API key is required when tracing is enabled. Aborting.");
    process.exit(1);
  }

  vars.set(LANGSMITH_KEYS.tracing, "true");
  vars.set(LANGSMITH_KEYS.endpoint, endpoint);
  vars.set(LANGSMITH_KEYS.apiKey, key.trim());
  vars.set(LANGSMITH_KEYS.project, LANGSMITH_PROJECT_DEFAULT);
  return true;
}

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

function writeEnvVars(
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

function checkNodeVersion(minimum: number) {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < minimum) {
    console.error(
      `Error: Node.js >= ${minimum} is required (found: v${process.versions.node})`,
    );
    process.exit(1);
  }
}

async function run() {
  checkNodeVersion(20);

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

  if (missing.length === 0) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      const tracingChanged = await promptLangSmithTracing(vars, rl);
      if (tracingChanged) {
        writeEnvVars(envContent, vars, [LANGSMITH_KEYS.tracing, LANGSMITH_KEYS.endpoint, LANGSMITH_KEYS.apiKey, LANGSMITH_KEYS.project]);
      }

      const postgresUrl = vars.get("POSTGRES_URL");
      if (postgresUrl) {
        await verifyPostgres(postgresUrl, rl);
      }
    } finally {
      rl.close();
    }
    return;
  }

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

    const tracingChanged = await promptLangSmithTracing(vars, rl);

    const keysToWrite = missing.map((v) => v.key);
    if (tracingChanged) {
      keysToWrite.push(LANGSMITH_KEYS.tracing, LANGSMITH_KEYS.endpoint, LANGSMITH_KEYS.apiKey, LANGSMITH_KEYS.project);
    }
    writeEnvVars(envContent, vars, keysToWrite);

    const postgresUrl = vars.get("POSTGRES_URL");
    if (postgresUrl) {
      await verifyPostgres(postgresUrl, rl);
    }
  } finally {
    rl.close();
  }
}

interface PgError extends Error {
  code: string;
}

function isPgError(err: unknown): err is PgError {
  return err instanceof Error && "code" in err;
}

function parseDatabaseName(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname.slice(1);
}

function buildMaintenanceUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

async function verifyPostgres(url: string, rl: Interface) {
  const dbName = parseDatabaseName(url);
  console.log(`Verifying Postgres connection to database "${dbName}"...`);

  const client = new pg.Client({ connectionString: url });

  try {
    await client.connect();
    console.log(`Connected to "${dbName}" successfully.\n`);
    await client.end();
    return;
  } catch (err) {
    if (!isPgError(err)) throw err;

    if (err.code === "3D000") {
      const answer = await rl.question(
        `Database "${dbName}" does not exist. Create it? (Y/n): `,
      );
      if (answer.trim().toLowerCase() === "n") {
        console.error("Aborting. Create the database manually or update POSTGRES_URL in .env.");
        process.exit(1);
      }
      await createDatabase(url, dbName);
      return;
    }

    if (err.code === "28000") {
      const parsed = new URL(url);
      console.error(
        `\nRole "${parsed.username}" does not exist in Postgres.\n` +
        "Update the username in POSTGRES_URL in your .env file.\n",
      );
      process.exit(1);
    }

    if (err.code === "28P01") {
      console.error(
        "\nPassword authentication failed.\n" +
        "Check the username and password in POSTGRES_URL in your .env file.\n",
      );
      process.exit(1);
    }

    if (err.message?.includes("ECONNREFUSED")) {
      const parsed = new URL(url);
      console.error(
        `\nNo Postgres server found at ${parsed.hostname}:${parsed.port || 5432}.\n` +
        "Make sure Postgres is running.\n",
      );
      process.exit(1);
    }

    console.error(`\nPostgres connection failed: ${err.message}\n`);
    console.error("Check your POSTGRES_URL in .env.\n");
    process.exit(1);
  }
}

async function createDatabase(url: string, dbName: string) {
  const maintenanceUrl = buildMaintenanceUrl(url);
  const client = new pg.Client({ connectionString: maintenanceUrl });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully.\n`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
