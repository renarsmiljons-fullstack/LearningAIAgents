import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";

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

const checkpointer = new MemorySaver();

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

async function main() {
  const userMessage =
    process.argv[2] ?? "Hi! What tools do you have available?";

  console.log(`\n> User: ${userMessage}\n`);

  const result = await agent.invoke(
    {
      messages: [{ role: "user", content: userMessage }],
    },
    config,
  );

  const lastMessage = result.messages[result.messages.length - 1];
  console.log(`> Agent: ${typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content)}\n`);
}

main().catch(console.error);
