import { AI_OPERATION_TIMEOUT_MS } from "@bao/shared/constants/interview";

export async function withAiOperationTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = AI_OPERATION_TIMEOUT_MS,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`AI operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ])
    .then(
      (value) => value,
      () => null,
    )
    .finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    });
}
