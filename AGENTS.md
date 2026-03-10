# Agent Instructions

This project is a sandbox for learning about AI agent frameworks. Instructions here are intentionally lean — detailed guidelines live in their own files under `.cursor/rules/` and `.cursor/skills/`.

## Rules (always applied)

- **Recursive Learning Pattern** — `.cursor/rules/recursive-learning.mdc` governs how to respond to learning-oriented questions.

## Skills (invoked on demand)

- **PR Creation** — `.cursor/skills/create-pr/SKILL.md` (planned)
- **Commit Conventions** — `.cursor/skills/commit/SKILL.md` (planned)

## Principles

- **Separation of concerns.** Each rule and skill is self-contained. Skills may reference rules and project files via `@` as needed — the agent discovers what it needs for the environment it's presented with.
- **Project-scoped.** All configuration lives within this repo (`.cursor/rules/`, `.cursor/skills/`), not in global user-level directories.
