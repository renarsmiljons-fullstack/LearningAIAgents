import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { AIMessageChunk, ToolMessage } from "langchain";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { z } from "zod";

const INTERESTING_NODES = new Set(["model_request", "tools"]);

const greet = tool(
  ({ name }: { name: string }) => `Hello, ${name}! I'm your local deep agent.`,
  {
    name: "greet",
    description: "Greet a person by name",
    schema: z.object({
      name: z.string().describe("The person's name"),
    }),
  },
);

function resolveSource(namespace: string[]): { label: string; isSubagent: boolean } {
  const toolSegment = namespace.find((s) => s.startsWith("tools:"));
  if (toolSegment) {
    return { label: `subagent:${toolSegment.split(":")[1]}`, isSubagent: true };
  }
  return { label: "main", isSubagent: false };
}

async function main() {
  const checkpointer = PostgresSaver.fromConnString(
    process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@localhost:5432/langgraph",
  );
  await checkpointer.setup();

  const agent = createDeepAgent({
    model: "openai:gpt-5.2",
    tools: [greet],
    systemPrompt:
      "You are a helpful assistant running locally. " +
      "Use your built-in tools for planning, file management, and task delegation. " +
      "Greet the user when asked.",
    checkpointer,
  });

  const config = {
    configurable: {
      thread_id: `thread-${Date.now()}`,
    },
  };

  const userMessage =
    process.argv[2] ?? "Hi! What tools do you have available?";

  console.log(`\n> User: ${userMessage}\n`);

  let lastSource = "";
  let midLine = false;

  for await (const [namespace, mode, data] of await agent.stream(
    { messages: [{ role: "user", content: userMessage }] },
    { ...config, streamMode: ["updates", "messages"], subgraphs: true },
  )) {
    const { label: source } = resolveSource(namespace);

    if (mode === "updates") {
      for (const [nodeName, nodeData] of Object.entries(data)) {
        if (!INTERESTING_NODES.has(nodeName)) continue;

        if (midLine) {
          process.stdout.write("\n");
          midLine = false;
        }

        if (nodeName === "tools") {
          const { messages = [] } = nodeData as { messages?: unknown[] };
          for (const msg of messages) {
            if ((msg as ToolMessage).type === "tool") {
              const toolMsg = msg as ToolMessage;
              console.log(`[${source}] tool result (${toolMsg.name}): ${String(toolMsg.content).slice(0, 200)}`);
            }
          }
        } else {
          console.log(`[${source}] step: ${nodeName}`);
        }
      }
    } else if (mode === "messages") {
      const [message] = data;

      if (AIMessageChunk.isInstance(message) && message.tool_call_chunks?.length) {
        for (const tc of message.tool_call_chunks) {
          if (tc.name) {
            if (midLine) {
              process.stdout.write("\n");
              midLine = false;
            }
            console.log(`[${source}] tool call: ${tc.name}`);
          }
        }
        continue;
      }

      if (message.text) {
        if (source !== lastSource) {
          if (midLine) {
            process.stdout.write("\n");
            midLine = false;
          }
          process.stdout.write(`\n[${source}] `);
          lastSource = source;
        }
        process.stdout.write(message.text);
        midLine = true;
      }
    }
  }

  if (midLine) process.stdout.write("\n");
  console.log();
}

main().catch(console.error);
