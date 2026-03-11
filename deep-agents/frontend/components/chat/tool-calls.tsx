"use client";

import { useState } from "react";
import { ChevronDownIcon, WrenchIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
  type?: string;
}

function isComplexValue(value: unknown): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function ArgValue({ value }: { value: unknown }) {
  if (isComplexValue(value)) {
    return (
      <pre className="mt-0.5 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span className="text-foreground">{String(value)}</span>;
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const args = toolCall.args;
  const hasArgs = Object.keys(args).length > 0;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="rounded-lg border border-border">
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs">
          <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground">{toolCall.name}</span>
          {toolCall.id && (
            <span className="truncate text-[10px] text-muted-foreground/60 font-mono">
              {toolCall.id}
            </span>
          )}
          <ChevronDownIcon
            className={cn(
              "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          {hasArgs ? (
            <div className="border-t border-border px-3 py-2">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(args).map(([key, value]) => (
                    <tr key={key} className="align-top">
                      <td className="w-1/4 pr-3 py-0.5 font-mono text-muted-foreground">
                        {key}
                      </td>
                      <td className="py-0.5">
                        <ArgValue value={value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              {"{}"}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface ToolResultCardProps {
  name?: string;
  toolCallId?: string;
  content: string;
}

const TRUNCATE_LENGTH = 500;
const TRUNCATE_LINES = 4;

function shouldTruncate(text: string): boolean {
  return text.length > TRUNCATE_LENGTH || text.split("\n").length > TRUNCATE_LINES;
}

function truncateContent(text: string): string {
  if (text.length > TRUNCATE_LENGTH) {
    return text.slice(0, TRUNCATE_LENGTH) + "…";
  }
  const lines = text.split("\n");
  if (lines.length > TRUNCATE_LINES) {
    return lines.slice(0, TRUNCATE_LINES).join("\n") + "\n…";
  }
  return text;
}

export function ToolResultCard({ name, toolCallId, content }: ToolResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  let parsedJson: unknown = null;
  let isJson = false;
  try {
    const parsed = JSON.parse(content);
    if (isComplexValue(parsed)) {
      parsedJson = parsed;
      isJson = true;
    }
  } catch {
    // not JSON
  }

  const displayText = isJson
    ? JSON.stringify(parsedJson, null, 2)
    : content;

  const canTruncate = shouldTruncate(displayText);
  const shown = canTruncate && !expanded ? truncateContent(displayText) : displayText;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="rounded-lg border border-border bg-muted/30">
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          {name ? (
            <span className="text-muted-foreground">
              Result:{" "}
              <span className="font-medium text-foreground">{name}</span>
            </span>
          ) : (
            <span className="font-medium text-foreground">Tool Result</span>
          )}
          {toolCallId && (
            <span className="truncate text-[10px] text-muted-foreground/60 font-mono">
              {toolCallId}
            </span>
          )}
          <ChevronDownIcon
            className={cn(
              "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border px-3 py-2">
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {shown}
            </pre>
            {canTruncate && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
