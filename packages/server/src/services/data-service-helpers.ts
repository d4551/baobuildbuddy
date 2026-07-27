import { toErrorMessage } from "@bao/shared/utils/error-helpers";

export const runWithErrorHandler = async (
  operation: () => Promise<void>,
  onError: (message: string) => void,
): Promise<void> => {
  await operation().then(
    () => undefined,
    (error: Error | string) => {
      onError(toErrorMessage(error));
    },
  );
};

export const runIgnoringErrors = async (operation: () => Promise<void>): Promise<void> => {
  await operation().then(
    () => undefined,
    () => undefined,
  );
};

export const runTasksSequentially = async (
  tasks: Array<() => Promise<void>>,
  index = 0,
): Promise<void> => {
  if (index >= tasks.length) {
    return;
  }
  await tasks[index]?.();
  await runTasksSequentially(tasks, index + 1);
};
