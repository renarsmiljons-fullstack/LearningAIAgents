import pg from "pg";
import type { SetupStep, SetupContext } from "../types";
import { SetupError } from "../types";

interface PgError extends Error {
  code: string;
}

function isPgError(err: unknown): err is PgError {
  return err instanceof Error && "code" in err;
}

function parseDatabaseName(url: string): string {
  return new URL(url).pathname.slice(1);
}

function buildMaintenanceUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

const PG_FATAL_ERRORS: Record<string, (url: URL) => string> = {
  "28000": (u) =>
    `\nRole "${u.username}" does not exist in Postgres.\n` +
    "Update the username in POSTGRES_URL in your .env file.\n",
  "28P01": () =>
    "\nPassword authentication failed.\n" +
    "Check the username and password in POSTGRES_URL in your .env file.\n",
};

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

async function handleMissingDatabase(
  url: string,
  dbName: string,
  ctx: SetupContext,
) {
  const answer = await ctx.ask(
    `Database "${dbName}" does not exist. Create it? (Y/n): `,
  );
  if (answer.trim().toLowerCase() === "n") {
    throw new SetupError(
      "Aborting. Create the database manually or update POSTGRES_URL in .env.",
    );
  }
  await createDatabase(url, dbName);
}

export const postgresStep: SetupStep = {
  name: "postgres",

  async run(ctx: SetupContext): Promise<string[]> {
    const url = ctx.vars.get("POSTGRES_URL");
    if (!url) return [];

    const dbName = parseDatabaseName(url);
    console.log(`Verifying Postgres connection to database "${dbName}"...`);

    const client = new pg.Client({ connectionString: url });

    try {
      await client.connect();
      console.log(`Connected to "${dbName}" successfully.\n`);
      await client.end();
      return [];
    } catch (err) {
      if (!isPgError(err)) throw err;

      if (err.code === "3D000") {
        await handleMissingDatabase(url, dbName, ctx);
        return [];
      }

      const parsed = new URL(url);
      const fatalMessage = PG_FATAL_ERRORS[err.code];
      if (fatalMessage) {
        throw new SetupError(fatalMessage(parsed));
      }

      if (err.message?.includes("ECONNREFUSED")) {
        throw new SetupError(
          `\nNo Postgres server found at ${parsed.hostname}:${parsed.port || 5432}.\n` +
            "Make sure Postgres is running.\n",
        );
      }

      throw new SetupError(
        `\nPostgres connection failed: ${err.message}\nCheck your POSTGRES_URL in .env.\n`,
      );
    }
  },
};
