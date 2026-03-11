"use client";

import { useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  LoaderIcon,
  XCircleIcon,
  BotIcon,
} from "lucide-react";
import type { ClassSubagentStreamInterface } from "@langchain/react";
import { AIMessage } from "@langchain/core/messages";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const statusStyles = {
  pending: {
    icon: LoaderIcon,
    iconClass: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    border: "border-border",
    bg: "",
  },
  running: {
    icon: LoaderIcon,
    iconClass: "animate-spin text-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
  },
  complete: {
    icon: CheckIcon,
    iconClass: "text-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "",
  },
  error: {
    icon: XCircleIcon,
    iconClass: "text-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50/50 dark:bg-red-950/20",
  },
} as const;

function getElapsedTime(
  startedAt: Date | null,
  completedAt: Date | null,
): string | null {
  if (!startedAt) return null;
  const end = completedAt ?? new Date();
  const seconds = Math.round((end.getTime() - startedAt.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function getStreamingContent(messages: ClassSubagentStreamInterface["messages"]): string {
  const aiMessages = messages.filter(AIMessage.isInstance);
  const last = aiMessages.at(-1);
  if (!last) return "";
  if (typeof last.content === "string") return last.content;
  if (Array.isArray(last.content)) {
    return last.content
      .filter(
        (c): c is { type: "text"; text: string } =>
          typeof c === "object" && c !== null && "type" in c && c.type === "text",
      )
      .map((c) => c.text)
      .join("");
  }
  return "";
}

interface SubagentCardProps {
  subagent: ClassSubagentStreamInterface;
}

export function SubagentCard({ subagent }: SubagentCardProps) {
  const [expanded, setExpanded] = useState(true);

  const style = statusStyles[subagent.status];
  const StatusIcon = style.icon;

  const title =
    subagent.toolCall?.args?.subagent_type ?? `Agent ${subagent.id.slice(0, 8)}`;
  const description = subagent.toolCall?.args?.description ?? "";

  const displayContent =
    subagent.status === "complete"
      ? subagent.result
      : getStreamingContent(subagent.messages);

  const elapsed = getElapsedTime(subagent.startedAt, subagent.completedAt);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div
        className={cn(
          "rounded-lg border transition-colors",
          style.border,
          style.bg,
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("size-4 shrink-0", style.iconClass)} />
            <BotIcon className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="font-medium capitalize">{title}</span>
            {description && (
              <span className="truncate text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {elapsed && (
              <span className="text-xs text-muted-foreground">{elapsed}</span>
            )}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                style.badge,
              )}
            >
              {subagent.status}
            </span>
            <ChevronDownIcon
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {displayContent && (
            <div className="border-t px-4 py-3">
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                {displayContent}
                {subagent.status === "running" && (
                  <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-blue-500" />
                )}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
