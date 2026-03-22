import {
  AGENTIFLOW_CAPABILITY_MATRIX_PATH,
  buildAgentiflowCapabilityMatrix,
  resolveAgentiflowCapabilityMatrixRelativePath,
} from "./utils/agentiflow-capability-matrix";
import { captureResult, toErrorMessage } from "./utils/async-control";
import { formatJsonWithBiome } from "./utils/biome-format";
import { writeError, writeOutput } from "./utils/cli-output";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeMatrixForComparison = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  const normalizedValue = { ...value };
  normalizedValue.generatedAt = undefined;
  return normalizedValue;
};

const main = async (): Promise<void> => {
  const matrix = await buildAgentiflowCapabilityMatrix();
  const expectedText = await formatJsonWithBiome(
    AGENTIFLOW_CAPABILITY_MATRIX_PATH,
    normalizeMatrixForComparison(matrix),
  );
  const matrixFile = Bun.file(AGENTIFLOW_CAPABILITY_MATRIX_PATH);
  const currentText = (await matrixFile.exists()) ? await matrixFile.text() : "";

  if (currentText.length === 0) {
    throw new Error(
      `Capability matrix drift detected in ${resolveAgentiflowCapabilityMatrixRelativePath()}. Run bun run capability:matrix.`,
    );
  }

  const currentValue: unknown = JSON.parse(currentText);
  const normalizedCurrentText = await formatJsonWithBiome(
    AGENTIFLOW_CAPABILITY_MATRIX_PATH,
    normalizeMatrixForComparison(currentValue),
  );

  if (normalizedCurrentText !== expectedText) {
    throw new Error(
      `Capability matrix drift detected in ${resolveAgentiflowCapabilityMatrixRelativePath()}. Run bun run capability:matrix.`,
    );
  }

  await writeOutput(
    `agentiflow capability matrix is current: ${resolveAgentiflowCapabilityMatrixRelativePath()}`,
  );
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(
    toErrorMessage(result.error, "Failed to validate the agentiflow capability matrix."),
  );
  process.exit(1);
}
