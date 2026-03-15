import { spawn } from "node:child_process";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const shell = tool(
  async function* ({ command }: { command: string }) {
    const child = spawn("bash", ["-c", command]);

    const pending: string[] = [];
    const fullOutput: string[] = [];

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      pending.push(text);
      fullOutput.push(text);
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      pending.push(text);
      fullOutput.push(text);
    });

    // Yield stdout/stderr chunks as they arrive until the process exits.
    // We poll because Node stream events and async generators don't compose
    // directly without a queue — keeping this simple and dependency-free.
    const done = new Promise<number | null>((resolve, reject) => {
      child.on("close", resolve);
      child.on("error", reject);
    });

    const tick = () => new Promise((r) => setTimeout(r, 50));

    while (true) {
      await tick();

      while (pending.length > 0) {
        yield { data: pending.shift()! };
      }

      const settled = await Promise.race([
        done.then((code) => ({ code })),
        tick().then(() => null),
      ]);

      if (settled !== null) {
        while (pending.length > 0) {
          yield { data: pending.shift()! };
        }
        return JSON.stringify({
          exitCode: settled.code,
          output: fullOutput.join(""),
        });
      }
    }
  },
  {
    name: "shell",
    description: "Execute a shell command. Output streams in real-time.",
    schema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
  },
);
