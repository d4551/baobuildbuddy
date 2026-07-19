import { automationRuntimeConfig } from "../runtime/config";

const runJobApplyScript = async (): Promise<number> => {
  const runtimeModule = await import("../job-apply/runtime");
  return runtimeModule.runJobApplyAutomation();
};

const runVerificationPath = async (): Promise<number> => {
  const verifyModule = await import("../job-apply/verify-run");
  return verifyModule.emitVerificationRun();
};

process.exitCode = automationRuntimeConfig.enableAutomationVerify
  ? await runVerificationPath()
  : await runJobApplyScript();
