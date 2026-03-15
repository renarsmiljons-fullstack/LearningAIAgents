import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { shell } from "./tools/shell.js";

const tools = [shell];

const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
}).bindTools(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

export function createGraph() {
  return new StateGraph(MessagesAnnotation)
    .addNode("callModel", callModel)
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "callModel")
    .addConditionalEdges("callModel", toolsCondition)
    .addEdge("tools", "callModel")
    .compile();
}
