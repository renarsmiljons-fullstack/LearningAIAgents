"use client";

import type { BaseMessage } from "@langchain/core/messages";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

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

export function MessageBubble({ message }: MessageBubbleProps) {
  const type = message.getType();
  if (type !== "human" && type !== "ai") return null;

  const isHuman = type === "human";
  const text = getTextContent(message);

  if (!text) return null;

  if (isHuman) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
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
    </div>
  );
}
