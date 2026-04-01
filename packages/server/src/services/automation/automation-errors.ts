export class AutomationConcurrencyLimitError extends Error {
  constructor(
    public readonly runningRuns: number,
    public readonly maxConcurrentRuns: number,
  ) {
    super(`Automation concurrency limit reached: ${runningRuns}/${maxConcurrentRuns}`);
  }
}

export class AutomationDependencyMissingError extends Error {
  constructor(
    public readonly resource: "resume" | "coverLetter",
    public readonly resourceId: string,
  ) {
    super(`${resource} not found: ${resourceId}`);
  }
}

export class AutomationValidationError extends Error {}

export class AutomationRunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Automation run not found: ${runId}`);
  }
}
