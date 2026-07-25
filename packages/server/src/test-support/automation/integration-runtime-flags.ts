const runtimeProcess = globalThis.process;
if (runtimeProcess) {
  runtimeProcess.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = "true";
  delete runtimeProcess.env.BAO_ENABLE_AUTOMATION_VERIFY;
}

const runtimeBun = globalThis.Bun;
if (runtimeBun) {
  runtimeBun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = "true";
  delete runtimeBun.env.BAO_ENABLE_AUTOMATION_VERIFY;
}
