import { createInterface } from "readline/promises";
import { checkNodeVersion } from "./setup/node-version";
import { ensureEnvFile, writeEnvVars } from "./setup/env-file";
import { SetupError } from "./setup/types";
import type { SetupStep, SetupContext } from "./setup/types";
import { requiredVarsStep } from "./setup/steps/required-vars";
import { langSmithStep } from "./setup/steps/langsmith";
import { postgresStep } from "./setup/steps/postgres";

const STEPS: SetupStep[] = [requiredVarsStep, langSmithStep, postgresStep];

async function run() {
  checkNodeVersion(20);

  const { content, vars } = ensureEnvFile();
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ctx: SetupContext = { vars, ask: (q) => rl.question(q) };

  try {
    const dirtyKeys: string[] = [];
    for (const step of STEPS) {
      dirtyKeys.push(...(await step.run(ctx)));
    }
    if (dirtyKeys.length > 0) {
      writeEnvVars(content, vars, dirtyKeys);
    }
  } finally {
    rl.close();
  }
}

run().catch((err) => {
  if (err instanceof SetupError) {
    console.error(err.message);
  } else {
    console.error("Setup failed:", err);
  }
  process.exit(1);
});
