import { createGraph } from "./graph.js";
import { isBaseMessage, type AIMessageChunk } from "@langchain/core/messages";

function isAIChunk(msg: unknown): msg is AIMessageChunk {
  return isBaseMessage(msg) && msg.getType() === "ai";
}

async function main() {
  const graph = createGraph();

  const userMessage =
    process.argv[2] ?? "List the files in the current directory using ls -la";
  console.log(`\n> User: ${userMessage}\n`);

  type Source = "model" | "tool" | "status" | null;
  let lastSource: Source = null;

  function ensureNewline(nextSource: Source) {
    if (lastSource !== null && lastSource !== nextSource) {
      process.stdout.write("\n");
    }
    lastSource = nextSource;
  }

  for await (const [mode, chunk] of await graph.stream(
    { messages: [{ role: "user", content: userMessage }] },
    { streamMode: ["updates", "messages", "tools"] },
  )) {
    if (mode === "tools") {
      const event = chunk as {
        event: string;
        name: string;
        data?: { data?: string };
        input?: unknown;
        output?: unknown;
      };

      switch (event.event) {
        case "on_tool_start":
          ensureNewline("status");
          console.log(`[tool:start] ${event.name}`);
          lastSource = null;
          break;

        case "on_tool_event":
          if (event.data?.data) {
            ensureNewline("tool");
            process.stdout.write(event.data.data);
          }
          break;

        case "on_tool_end":
          ensureNewline("status");
          console.log(`[tool:end] ${event.name}`);
          lastSource = null;
          break;

        case "on_tool_error":
          ensureNewline("status");
          console.error(`[tool:error] ${event.name}`);
          lastSource = null;
          break;
      }
    } else if (mode === "messages") {
      const [message] = chunk as [unknown, unknown];

      if (isAIChunk(message) && message.tool_call_chunks?.length) {
        for (const tc of message.tool_call_chunks) {
          if (tc.name) {
            ensureNewline("status");
            console.log(`[model] calling ${tc.name}...`);
            lastSource = null;
          }
        }
        continue;
      }

      if (
        isAIChunk(message) &&
        typeof message.content === "string" &&
        message.content
      ) {
        ensureNewline("model");
        process.stdout.write(message.content);
      }
    }
  }

  if (lastSource !== null) process.stdout.write("\n");
  console.log();
}

main().catch(console.error);
