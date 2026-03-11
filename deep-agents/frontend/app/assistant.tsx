"use client";

import { useStream } from "@langchain/react";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";

const API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:2024";
const ASSISTANT_ID =
  process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID || "agent";

/**
 * Phantom type satisfying the DeepAgent type check in @langchain/react.
 * The `~deepAgentTypes` brand enables `filterSubagentMessages` and subagent
 * streaming helpers on the `useStream` hook without importing the backend agent.
 */
type DeepAgentBrand = {
  "~deepAgentTypes": {
    Response: unknown;
    State: unknown;
    Context: unknown;
    Middleware: unknown;
    Tools: unknown;
    Subagents: unknown;
  };
  "~agentTypes": {
    Response: unknown;
    State: unknown;
    Context: unknown;
    Middleware: unknown;
    Tools: unknown;
  };
};

export function Assistant() {
  const stream = useStream<DeepAgentBrand>({
    apiUrl: API_URL,
    assistantId: ASSISTANT_ID,
    fetchStateHistory: true,
    filterSubagentMessages: true,
  });

  const handleSubmit = (text: string) => {
    stream.submit(
      { messages: [{ type: "human", content: text }] },
      { streamMode: ["messages"], streamSubgraphs: true },
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <MessageList stream={stream} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        <ChatInput onSubmit={handleSubmit} isLoading={stream.isLoading} />
      </div>
    </div>
  );
}
