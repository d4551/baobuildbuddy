import { captureResult, toErrorMessage } from "./utils/async-control";
import {
  AGENTIFLOW_CAPABILITY_MATRIX_PATH,
  buildAgentiflowCapabilityMatrix,
  resolveAgentiflowCapabilityMatrixRelativePath,
} from "./utils/agentiflow-capability-matrix";
import { writeFormattedJsonFile } from "./utils/biome-format";
import { writeError, writeOutput } from "./utils/cli-output";

const main = async (): Promise<void> => {
  const matrix = await buildAgentiflowCapabilityMatrix();
  await writeFormattedJsonFile(AGENTIFLOW_CAPABILITY_MATRIX_PATH, matrix);
  await writeOutput(
    `agentiflow capability matrix refreshed: ${resolveAgentiflowCapabilityMatrixRelativePath()}`,
  );
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(
    toErrorMessage(result.error, "Failed to refresh the agentiflow capability matrix."),
  );
  process.exit(1);
}
