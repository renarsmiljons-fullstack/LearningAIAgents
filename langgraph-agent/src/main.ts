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

  let midLine = false;

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
          if (midLine) {
            process.stdout.write("\n");
            midLine = false;
          }
          console.log(`[tool:start] ${event.name}`);
          break;

        case "on_tool_event":
          if (event.data?.data) {
            process.stdout.write(event.data.data);
            midLine = true;
          }
          break;

        case "on_tool_end":
          if (midLine) {
            process.stdout.write("\n");
            midLine = false;
          }
          console.log(`[tool:end] ${event.name}`);
          break;

        case "on_tool_error":
          if (midLine) {
            process.stdout.write("\n");
            midLine = false;
          }
          console.error(`[tool:error] ${event.name}`);
          break;
      }
    } else if (mode === "messages") {
      const [message] = chunk as [unknown, unknown];

      if (isAIChunk(message) && message.tool_call_chunks?.length) {
        for (const tc of message.tool_call_chunks) {
          if (tc.name) {
            if (midLine) {
              process.stdout.write("\n");
              midLine = false;
            }
            console.log(`[model] calling ${tc.name}...`);
          }
        }
        continue;
      }

      if (
        isAIChunk(message) &&
        typeof message.content === "string" &&
        message.content
      ) {
        if (midLine) {
          process.stdout.write("\n");
          midLine = false;
        }
        process.stdout.write(message.content);
        midLine = true;
      }
    } else if (mode === "updates") {
      // Could handle step transitions here if needed
    }
  }

  if (midLine) process.stdout.write("\n");
  console.log();
}

main().catch(console.error);
