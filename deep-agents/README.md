# Deep Agents

Exploration workspace for building AI agents with [LangChain](https://js.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraphjs/), and the [DeepAgents](https://www.npmjs.com/package/deepagents) framework.

## Getting Started

Requires Node.js >= 20.

```bash
npm install
npm start
```

On first run, the setup wizard will prompt for any missing environment variables (`OPENAI_API_KEY`, `POSTGRES_URL`) and create your `.env` file.

## Running

```bash
npm start                        # single run
npm start -- "Your message here" # single run with custom prompt
npm run dev                      # watch mode (restarts on file changes)
```

The setup wizard runs automatically before each start. If all variables are already configured, it passes through silently.
