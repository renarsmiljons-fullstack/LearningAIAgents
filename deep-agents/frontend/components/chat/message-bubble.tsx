"use client";

import type { BaseMessage } from "@langchain/core/messages";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ToolCallCard, ToolResultCard } from "./tool-calls";

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

interface MessageBubbleProps {
  message: BaseMessage;
}

function getTextContent(message: BaseMessage): string {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .filter(
        (block): block is { type: "text"; text: string } =>
          typeof block === "object" &&
          block !== null &&
          "type" in block &&
          block.type === "text",
      )
      .map((block) => block.text)
      .join("");
  }
  return "";
}

function getToolCalls(message: BaseMessage): ToolCall[] {
  if ("tool_calls" in message && Array.isArray(message.tool_calls)) {
    return message.tool_calls as ToolCall[];
  }
  return [];
}

function HumanMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm">
        {text}
      </div>
    </div>
  );
}

function AiMessageContent({ text }: { text: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
        "prose-pre:rounded-lg prose-pre:bg-muted prose-pre:p-3",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5",
        "prose-code:before:content-none prose-code:after:content-none",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

function ToolMessage({ message }: { message: BaseMessage }) {
  const content = typeof message.content === "string"
    ? message.content
    : JSON.stringify(message.content);

  const name = "name" in message ? (message.name as string) : undefined;
  const toolCallId = "tool_call_id" in message
    ? (message.tool_call_id as string)
    : undefined;

  return <ToolResultCard name={name} toolCallId={toolCallId} content={content} />;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const type = message.getType();

  if (type === "human") {
    const text = getTextContent(message);
    if (!text) return null;
    return <HumanMessage text={text} />;
  }

  if (type === "tool") {
    return <ToolMessage message={message} />;
  }

  if (type === "ai") {
    const text = getTextContent(message);
    const toolCalls = getToolCalls(message);
    if (!text && toolCalls.length === 0) return null;

    return (
      <div className="max-w-full space-y-2">
        {text && <AiMessageContent text={text} />}
        {toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {toolCalls.map((tc) => (
              <ToolCallCard key={tc.id ?? tc.name} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
