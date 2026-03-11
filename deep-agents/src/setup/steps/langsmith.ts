import type { SetupStep, SetupContext } from "../types";
import { SetupError } from "../types";

const KEYS = {
  tracing: "LANGSMITH_TRACING",
  endpoint: "LANGSMITH_ENDPOINT",
  apiKey: "LANGSMITH_API_KEY",
  project: "LANGSMITH_PROJECT",
} as const;

const PROJECT_DEFAULT = "deep-agents";
const ENDPOINT_DEFAULT = "https://api.smith.langchain.com";
const ENDPOINT_EU = "https://eu.api.smith.langchain.com";

async function askRegion(ctx: SetupContext): Promise<string> {
  const region = await ctx.ask(
    `LangSmith region — US or EU? (${ENDPOINT_DEFAULT}) : `,
  );
  return region.trim().toLowerCase() === "eu" ? ENDPOINT_EU : ENDPOINT_DEFAULT;
}

async function askApiKey(ctx: SetupContext): Promise<string> {
  const key = await ctx.ask("Enter your LangSmith API key: ");
  if (!key.trim()) {
    throw new SetupError(
      "LangSmith API key is required when tracing is enabled. Aborting.",
    );
  }
  return key.trim();
}

export const langSmithStep: SetupStep = {
  name: "langsmith",

  async run(ctx: SetupContext): Promise<string[]> {
    const tracingEnabled = ctx.vars.get(KEYS.tracing) === "true";
    const hasApiKey = !!ctx.vars.get(KEYS.apiKey);

    if (tracingEnabled && hasApiKey) return [];

    if (tracingEnabled && !hasApiKey) {
      if (!ctx.vars.has(KEYS.endpoint)) {
        ctx.vars.set(KEYS.endpoint, await askRegion(ctx));
      }

      ctx.vars.set(KEYS.apiKey, await askApiKey(ctx));
      ctx.vars.set(
        KEYS.project,
        ctx.vars.get(KEYS.project) ?? PROJECT_DEFAULT,
      );

      return [KEYS.tracing, KEYS.endpoint, KEYS.apiKey, KEYS.project];
    }

    const answer = await ctx.ask("Enable LangSmith tracing? (y/N): ");
    if (answer.trim().toLowerCase() !== "y") return [];

    ctx.vars.set(KEYS.endpoint, await askRegion(ctx));
    ctx.vars.set(KEYS.apiKey, await askApiKey(ctx));
    ctx.vars.set(KEYS.tracing, "true");
    ctx.vars.set(KEYS.project, PROJECT_DEFAULT);

    return [KEYS.tracing, KEYS.endpoint, KEYS.apiKey, KEYS.project];
  },
};
