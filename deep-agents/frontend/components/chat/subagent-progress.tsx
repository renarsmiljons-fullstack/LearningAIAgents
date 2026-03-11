"use client";

import type { ClassSubagentStreamInterface } from "@langchain/react";

interface SubagentProgressProps {
  subagents: ClassSubagentStreamInterface[];
}

export function SubagentProgress({ subagents }: SubagentProgressProps) {
  if (subagents.length === 0) return null;

  const completed = subagents.filter(
    (s) => s.status === "complete" || s.status === "error",
  ).length;
  const total = subagents.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 tabular-nums">
        {completed}/{total} complete
      </span>
    </div>
  );
}
