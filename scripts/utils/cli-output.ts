/**
 * Emit a standard output message.
 */
export const writeOutput = (value: string): Promise<void> => {
  process.stdout.write(`${value}\n`);
  return Promise.resolve();
};

/**
 * Emit a standard error message.
 */
export const writeError = (value: string): Promise<void> => {
  process.stderr.write(`${value}\n`);
  return Promise.resolve();
};
