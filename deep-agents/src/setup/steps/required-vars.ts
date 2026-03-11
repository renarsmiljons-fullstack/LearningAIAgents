import { userInfo } from "os";
import type { SetupStep, SetupContext } from "../types";
import { isMissing } from "../env-file";
import { SetupError } from "../types";

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

export const requiredVarsStep: SetupStep = {
  name: "required-vars",

  async run(ctx: SetupContext): Promise<string[]> {
    const missing = REQUIRED_VARS.filter((v) =>
      isMissing(ctx.vars.get(v.key), v.placeholders),
    );

    if (missing.length === 0) return [];

    console.log("Some required environment variables are not configured.\n");

    const changed: string[] = [];

    for (const v of missing) {
      const suffix = v.defaultValue ? ` (${v.defaultValue})` : "";
      const answer = await ctx.ask(`${v.prompt}${suffix}: `);
      const value = answer.trim() || v.defaultValue;

      if (!value) {
        throw new SetupError(`${v.key} is required. Aborting.`);
      }

      ctx.vars.set(v.key, value);
      changed.push(v.key);
    }

    return changed;
  },
};
