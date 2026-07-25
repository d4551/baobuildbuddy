/**
 * Module-level env reader for browser proof scripts.
 * Sole allowed env surface for PAGE_PROOF_* / browser artifact paths.
 */
type EnvMap = Readonly<Record<string, string | undefined>>;

const TRAILING_SLASH_RE = /\/$/u;

const readRuntimeEnv = (): EnvMap => {
  const runtime = globalThis as {
    process?: { env?: EnvMap };
  };
  return runtime.process?.env ?? {};
};

export const resolveProofClientBase = (defaultBase: string): string => {
  const raw = readRuntimeEnv().PAGE_PROOF_CLIENT_BASE ?? defaultBase;
  return raw.replace(TRAILING_SLASH_RE, "");
};

export const resolveProofOutDir = (key: string, defaultDir: string): string => {
  const value = readRuntimeEnv()[key];
  return value && value.length > 0 ? value : defaultDir;
};

export const resolveProofEnv = (key: string): string | undefined => readRuntimeEnv()[key];
