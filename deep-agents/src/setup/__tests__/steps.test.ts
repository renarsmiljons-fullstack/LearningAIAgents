import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import type { SetupContext } from "../types";
import { SetupError } from "../types";
import { requiredVarsStep } from "../steps/required-vars";
import { langSmithStep } from "../steps/langsmith";

function createContext(
  initial: Record<string, string>,
  answers: string[],
): SetupContext {
  let i = 0;
  return {
    vars: new Map(Object.entries(initial)),
    ask: async () => {
      if (i >= answers.length) throw new Error("Unexpected prompt");
      return answers[i++];
    },
  };
}

describe("required-vars step", () => {
  it("prompts for missing keys and returns them", async () => {
    const ctx = createContext({}, ["sk-test-key", ""]);

    const changed = await requiredVarsStep.run(ctx);

    assert.ok(ctx.vars.has("OPENAI_API_KEY"));
    assert.equal(ctx.vars.get("OPENAI_API_KEY"), "sk-test-key");
    assert.ok(ctx.vars.has("POSTGRES_URL"));
    assert.ok(changed.includes("OPENAI_API_KEY"));
    assert.ok(changed.includes("POSTGRES_URL"));
  });

  it("skips already-configured keys", async () => {
    const ctx = createContext(
      {
        OPENAI_API_KEY: "sk-existing",
        POSTGRES_URL: "postgresql://localhost/db",
      },
      [],
    );

    const changed = await requiredVarsStep.run(ctx);

    assert.deepStrictEqual(changed, []);
  });

  it("throws SetupError when required key left empty with no default", async () => {
    const ctx = createContext({}, [""]);

    await assert.rejects(() => requiredVarsStep.run(ctx), SetupError);
  });
});

describe("langsmith step", () => {
  it("returns empty when tracing already fully configured", async () => {
    const ctx = createContext(
      {
        LANGSMITH_TRACING: "true",
        LANGSMITH_API_KEY: "lsv2-existing",
      },
      [],
    );

    const changed = await langSmithStep.run(ctx);

    assert.deepStrictEqual(changed, []);
  });

  it("prompts for API key when tracing enabled but key missing", async () => {
    const ctx = createContext(
      { LANGSMITH_TRACING: "true" },
      ["US", "lsv2-new-key"],
    );

    const changed = await langSmithStep.run(ctx);

    assert.equal(ctx.vars.get("LANGSMITH_API_KEY"), "lsv2-new-key");
    assert.ok(changed.includes("LANGSMITH_API_KEY"));
  });

  it("skips when user declines tracing", async () => {
    const ctx = createContext({}, ["n"]);

    const changed = await langSmithStep.run(ctx);

    assert.deepStrictEqual(changed, []);
  });

  it("configures full tracing when user opts in", async () => {
    const ctx = createContext({}, ["y", "EU", "lsv2-key"]);

    const changed = await langSmithStep.run(ctx);

    assert.equal(ctx.vars.get("LANGSMITH_TRACING"), "true");
    assert.equal(
      ctx.vars.get("LANGSMITH_ENDPOINT"),
      "https://eu.api.smith.langchain.com",
    );
    assert.equal(ctx.vars.get("LANGSMITH_API_KEY"), "lsv2-key");
    assert.equal(ctx.vars.get("LANGSMITH_PROJECT"), "deep-agents");
    assert.equal(changed.length, 4);
  });

  it("throws SetupError when API key left empty", async () => {
    const ctx = createContext({}, ["y", "US", ""]);

    await assert.rejects(() => langSmithStep.run(ctx), SetupError);
  });
});
