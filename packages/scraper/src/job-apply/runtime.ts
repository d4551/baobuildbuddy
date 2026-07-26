import { jobApplyScriptEnvelopeSchema } from "@bao/shared/schemas/automation-scripts.schema";
import { parseScriptInput } from "../runtime/io";
import { ProtocolEmitter } from "../runtime/protocol";
import { fillCustomFieldsStep, fillPrimaryFields } from "./runtime-field-fill";
import {
  createExecutionState,
  detectStrategy,
  finalizeSuccessfulRun,
  initializeApplicationPage,
} from "./runtime-page-setup";
import { submitApplicationStep, verifySubmissionStep } from "./runtime-submission";

/**
 * Executes the Bun-based job-apply runtime using shared contracts.
 *
 * @returns Process exit code.
 */
export const runJobApplyAutomation = async (): Promise<number> => {
  const inputResult = await parseScriptInput(jobApplyScriptEnvelopeSchema);
  const runId = inputResult.ok ? inputResult.value.runId : "run-missing-id";
  const emitter = new ProtocolEmitter(runId);

  if (!inputResult.ok) {
    emitter.emitError("OUTPUT_VALIDATION_ERROR", inputResult.message);
    return 1;
  }

  const state = await createExecutionState(inputResult.value, emitter);
  if (!state) {
    return 1;
  }

  const initializeResult = await initializeApplicationPage(state);
  if (initializeResult !== null) {
    return initializeResult;
  }

  const strategy = await detectStrategy(state);
  await fillPrimaryFields(state, strategy);
  await fillCustomFieldsStep(state);
  await submitApplicationStep(state, strategy);
  await verifySubmissionStep(state);
  return finalizeSuccessfulRun(state);
};
