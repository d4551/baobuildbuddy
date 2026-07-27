/**
 * Fail-closed display repair for historical job-apply rows that were persisted
 * as success while step ledger / verify proof contradicts it.
 */

export type AutomationStepLike = {
  readonly action?: string;
  readonly status?: string;
  readonly message?: string;
};

export type AutomationOutputLike = {
  readonly success?: boolean;
  readonly steps?: ReadonlyArray<AutomationStepLike | null>;
  readonly error?: string;
};

const NO_CONFIRMATION = "no confirmation text detected";

function readSteps(output: AutomationOutputLike | null | undefined): AutomationStepLike[] {
  if (!output || !Array.isArray(output.steps)) {
    return [];
  }
  return output.steps.filter(
    (step): step is AutomationStepLike => typeof step === "object" && step !== null,
  );
}

/** True when a persisted success row cannot be trusted as a real apply win. */
export function isDishonestJobApplySuccess(args: {
  readonly type: string;
  readonly status: string;
  readonly output: AutomationOutputLike | null | undefined;
  readonly error?: string | null;
}): boolean {
  if (args.type !== "job_apply" || args.status !== "success") {
    return false;
  }

  if (args.output?.success === false) {
    return true;
  }

  if (typeof args.error === "string" && args.error.trim().length > 0) {
    return true;
  }

  const steps = readSteps(args.output);
  if (steps.some((step) => step.status === "error")) {
    return true;
  }

  return steps.some((step) => {
    if (step.action !== "verify") {
      return false;
    }
    const message = typeof step.message === "string" ? step.message.toLowerCase() : "";
    return message.includes(NO_CONFIRMATION);
  });
}

/** Status the UI/API should surface after honesty repair. */
export function resolveHonestAutomationRunStatus(args: {
  readonly type: string;
  readonly status: string;
  readonly output: AutomationOutputLike | null | undefined;
  readonly error?: string | null;
}): string {
  if (isDishonestJobApplySuccess(args)) {
    return "error";
  }
  return args.status;
}
