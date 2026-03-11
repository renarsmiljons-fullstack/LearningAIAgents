"use client";

import { useRef, useEffect } from "react";
import type { BaseMessage } from "@langchain/core/messages";
import type { ClassSubagentStreamInterface } from "@langchain/react";
import { MessageBubble } from "./message-bubble";
import { SubagentCard } from "./subagent-card";
import { SubagentProgress } from "./subagent-progress";
import { SynthesisIndicator } from "./synthesis-indicator";

interface MessageListProps {
  stream: {
    messages: BaseMessage[];
    isLoading: boolean;
    getSubagentsByMessage: (messageId: string) => ClassSubagentStreamInterface[];
  };
}

export function MessageList({ stream }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.messages, stream.isLoading]);

  if (stream.messages.length === 0 && !stream.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
        <h1 className="text-2xl font-semibold">Deep Agent</h1>
        <p className="text-muted-foreground">
          Ask me anything — I can plan, delegate to subagents, and manage files.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4">
      <div className="mx-auto max-w-3xl space-y-4 pb-4">
        {stream.messages.map((message, idx) => {
          const subagents = stream.getSubagentsByMessage(message.id ?? "");

          return (
            <div key={message.id ?? idx} className="space-y-3">
              <MessageBubble message={message} />

              {subagents.length > 0 && (
                <div className="ml-4 space-y-3 border-l-2 border-blue-200 pl-4 dark:border-blue-800">
                  <SubagentProgress subagents={subagents} />
                  {subagents.map((subagent) => (
                    <SubagentCard key={subagent.id} subagent={subagent} />
                  ))}
                  <SynthesisIndicator
                    subagents={subagents}
                    isLoading={stream.isLoading}
                  />
                </div>
              )}
            </div>
          );
        })}

        {stream.isLoading && stream.messages.length > 0 && (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <span className="inline-block size-2 animate-pulse rounded-full bg-blue-500" />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
