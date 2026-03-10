# Agent Instructions

This project is a sandbox for learning about AI agent frameworks. Instructions here are intentionally lean — detailed guidelines live in their own files under `.cursor/rules/` and `.cursor/skills/`.

## Rules (always applied)

- **Recursive Learning Pattern** — `.cursor/rules/recursive-learning.mdc` governs how to respond to learning-oriented questions.

## Skills (invoked on demand)

- **PR Creation** — `.cursor/skills/create-pr/SKILL.md` — invoke via `/create-pr`
- **Commit Conventions** — `.cursor/skills/commit/SKILL.md` — invoke via `/commit`

## Engineering Philosophy

- **SOLID principles apply.** Even in functional code. This is a reminder, not a lesson — apply the principles, don't explain them.
- **Prevention over cure.** Thoughtful upfront design always beats reactive fixes. After completing work, step back and reflect on what was written against the principles before considering it done.

## Context Management

- **Delegate aggressively.** Use sub-agents for research, exploration, and execution to keep the main conversation context slim and focused.
- **Match model to task.** Use `model: "fast"` for straightforward execution where reasoning is minimal. Inherit the parent model for tasks requiring deep reasoning or nuanced judgment.
- **Keep responses focused.** Don't pollute the main thread with raw tool output or side-quest research. Summarize sub-agent findings concisely.

## Principles

- **Separation of concerns.** Each rule and skill is self-contained. Skills may reference rules and project files via `@` as needed — the agent discovers what it needs for the environment it's presented with.
- **Project-scoped.** All configuration lives within this repo (`.cursor/rules/`, `.cursor/skills/`), not in global user-level directories.
