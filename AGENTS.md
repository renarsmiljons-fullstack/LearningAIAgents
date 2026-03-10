## Engineering Philosophy

- **SOLID principles apply.** Even in functional code:
  - **S** — Single Responsibility. Every module, function, or component should have one reason to change.
  - **O** — Open/Closed. Software should be open for extension, closed for modification.
  - **L** — Liskov Substitution. Replaceable parts must honor the contract of what they replace.
  - **I** — Interface Segregation. Don't force consumers to depend on things they don't use.
  - **D** — Dependency Inversion. Depend on abstractions, not concrete implementations.
- **Prevention over cure.** Thoughtful upfront design always beats reactive fixes. After completing work, step back and reflect on what was written against the principles before considering it done.

## Context Management

- **Delegate aggressively.** Use sub-agents for research, exploration, and execution to keep the main conversation context slim and focused.
- **Match model to task.** Use `model: "fast"` for straightforward execution where reasoning is minimal. Inherit the parent model for tasks requiring deep reasoning or nuanced judgment.
- **Keep responses focused.** Don't pollute the main thread with raw tool output or side-quest research. Summarize sub-agent findings concisely.

## Standard Operating Procedures

These are mandatory — follow them every time, without needing to be asked.

- **Committing** — Before creating any commit, read and follow `.cursor/skills/commit/SKILL.md`.
- **Pull Requests** — Before creating or editing any PR, read and follow `.cursor/skills/create-pr/SKILL.md`.

## Rules (always applied)

- **Recursive Learning Pattern** — `.cursor/rules/recursive-learning.mdc` governs how to respond to learning-oriented questions.
