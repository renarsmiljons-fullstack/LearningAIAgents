export interface SetupContext {
  readonly vars: Map<string, string>;
  ask(question: string): Promise<string>;
}

export interface SetupStep {
  readonly name: string;
  run(ctx: SetupContext): Promise<string[]>;
}

export class SetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SetupError";
  }
}
