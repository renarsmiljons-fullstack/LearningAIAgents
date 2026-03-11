"use client";

import { SparklesIcon } from "lucide-react";
import type { ClassSubagentStreamInterface } from "@langchain/react";

interface SynthesisIndicatorProps {
  subagents: ClassSubagentStreamInterface[];
  isLoading: boolean;
}

export function SynthesisIndicator({
  subagents,
  isLoading,
}: SynthesisIndicatorProps) {
  if (!isLoading || subagents.length === 0) return null;

  const allDone = subagents.every(
    (s) => s.status === "complete" || s.status === "error",
  );
  if (!allDone) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <SparklesIcon className="size-4 animate-pulse text-amber-500" />
      Synthesizing results...
    </div>
  );
}
