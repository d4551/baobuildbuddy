import type { RpaRunResult } from "@bao/shared";
import type { RpaScriptExecutionResult } from "./rpa-runner";
export declare const sanitizeRunId: (runId: string, invalidRunIdMessage: string) => string;
export declare const resolveRunArtifactDir: (runId: string, invalidRunIdMessage: string) => string;
export declare const copyAndIndexScreenshots: (runDir: string, sourceScreenshots: string[] | undefined) => Promise<string[]>;
export declare const normalizeExecutionArtifacts: (_runId: string, runDir: string, execution: RpaScriptExecutionResult) => Promise<RpaRunResult>;
