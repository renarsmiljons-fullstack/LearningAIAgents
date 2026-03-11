import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

const PORTS = [2024, 3000];

function getPidOnPort(port: number): number | null {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { encoding: "utf-8" }).trim();
    if (!output) return null;
    return parseInt(output.split("\n")[0], 10);
  } catch {
    return null;
  }
}

function ask(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith("y"));
    });
  });
}

async function main() {
  const conflicts: { port: number; pid: number }[] = [];

  for (const port of PORTS) {
    const pid = getPidOnPort(port);
    if (pid !== null) {
      conflicts.push({ port, pid });
    }
  }

  if (conflicts.length === 0) return;

  console.log("\nPort conflicts detected:");
  for (const { port, pid } of conflicts) {
    console.log(`  Port ${port} is in use by PID ${pid}`);
  }

  const shouldKill = await ask("\nKill these processes? (y/N) ");

  if (!shouldKill) {
    console.log("Aborting.");
    process.exit(1);
  }

  for (const { port, pid } of conflicts) {
    try {
      process.kill(pid, "SIGTERM");
      console.log(`  Killed PID ${pid} (port ${port})`);
    } catch {
      console.log(`  Failed to kill PID ${pid} — you may need to stop it manually`);
    }
  }

  // Brief pause to let ports release
  await new Promise((r) => setTimeout(r, 500));
}

main().catch(console.error);
