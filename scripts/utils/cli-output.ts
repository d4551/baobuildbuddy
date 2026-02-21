/**
 * Write a message to a destination stream with a trailing newline.
 */
const writeLine = async (
  stream: typeof Bun.stdout | typeof Bun.stderr,
  value: string,
): Promise<void> => {
  await Bun.write(stream, `${value}\n`);
};

/**
 * Emit a standard output message.
 */
export const writeOutput = async (value: string): Promise<void> => {
  await writeLine(Bun.stdout, value);
};

/**
 * Emit a standard error message.
 */
export const writeError = async (value: string): Promise<void> => {
  await writeLine(Bun.stderr, value);
};
