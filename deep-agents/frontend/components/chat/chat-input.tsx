"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue("");
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground"
        rows={1}
        aria-label="Message input"
      />
      <div className="mx-2 mb-2 flex items-center justify-end">
        {isLoading ? (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Stop generating"
          >
            <SquareIcon className="size-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
