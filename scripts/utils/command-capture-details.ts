export type CommandCaptureLike = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
};

export const resolveCommandDetails = (
  commandResult: CommandCaptureLike,
  labels: { readonly success: string; readonly timeout: string },
): string => {
  if (commandResult.exitCode === 0) {
    return labels.success;
  }
  if (commandResult.timedOut) {
    return labels.timeout;
  }
  return commandResult.stderr || commandResult.stdout || `exitCode=${commandResult.exitCode}`;
};
