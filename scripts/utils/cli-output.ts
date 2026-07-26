/**
 * Stream writers that resolve only once the payload is flushed.
 *
 * `process.stdout` / `process.stderr` buffer when the write exceeds the pipe
 * capacity, and `process.exit()` discards whatever is still buffered. Callers
 * that report a long violation list and then exit non-zero were losing the tail
 * of their own output, so every writer awaits `drain` before resolving.
 */
const writeStream = (stream: NodeJS.WriteStream, value: string): Promise<void> =>
  new Promise((resolve) => {
    if (stream.write(`${value}\n`)) {
      resolve();
      return;
    }
    stream.once("drain", resolve);
  });

/**
 * Emit a standard output message.
 */
export const writeOutput = (value: string): Promise<void> => writeStream(process.stdout, value);

/**
 * Emit a standard error message.
 */
export const writeError = (value: string): Promise<void> => writeStream(process.stderr, value);
