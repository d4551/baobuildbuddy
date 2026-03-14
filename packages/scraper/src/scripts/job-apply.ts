import { runJobApplyAutomation } from "../job-apply/runtime";

process.exitCode = await runJobApplyAutomation();
