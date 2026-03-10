# Agent Instructions

## Recursive Learning Pattern

### When to apply

Use this pattern when the user's question is **learning-oriented** — they are trying to understand a concept, deepen their knowledge, or improve their mental model of a topic. This includes questions like "How does X work?", "What is the difference between X and Y?", "Why would I use X over Y?", etc.

**Do not** apply this pattern to questions that are task-oriented — bug investigations, code changes, debugging, implementation requests, or other hands-on engineering work. Those should be handled directly.

### How to respond

1. **Research first.** Dispatch a sub-agent to research the topic (web search, codebase exploration, or both — whatever fits). Gather enough context to give an accurate, grounded answer.

2. **Provide a brief explanation.** Respond with a short, top-level summary — no more than a few sentences. The goal is to give the user just enough to orient themselves, not an exhaustive treatise. Clarity and precision over length.

3. **Offer follow-up questions.** After the explanation, present a numbered list of questions the user might want to ask next. These should:
   - Progress from foundational to more advanced
   - Cover different angles of the topic (trade-offs, internals, practical usage, common pitfalls)
   - Be specific enough to be immediately useful, not generic

### Why this pattern exists

The user learns best through short, focused exchanges rather than long monologues. Each answer should open doors to further exploration, creating a recursive loop: **brief answer → follow-up questions → pick a direction → brief answer → …** — until the user has the depth they need.
