import { describe, expect, test } from "bun:test";
import { AUTH_KEY_PREFIX } from "../constants/auth";
import {
  automationBrowserLaunchFailureToDetails,
  classifyAutomationBrowserLaunchFailure,
  formatAutomationBrowserLaunchFailureMessage,
  sanitizeAutomationBrowserLaunchDiagnostic,
} from "./automation-browser-launch-failure";
import { CURSOR_SANDBOX_BROWSER_CACHE_MARKER } from "./playwright-browsers-path";

describe("classifyAutomationBrowserLaunchFailure", () => {
  test("classifies missing browser executable distinctly from SEGV", () => {
    const missing = classifyAutomationBrowserLaunchFailure(
      new Error("browserType.launch: Executable doesn't exist at /tmp/chromium"),
      "launch",
    );
    const crashed = classifyAutomationBrowserLaunchFailure(
      new Error("browserType.launch: Target closed (Received signal SIGSEGV)"),
      "launch",
    );

    expect(missing.failureMode).toBe("BROWSER_EXECUTABLE_MISSING");
    expect(crashed.failureMode).toBe("BROWSER_PROCESS_CRASHED");
    expect(missing.failureMode).not.toBe(crashed.failureMode);
    expect(missing.causeMessage).toContain("Executable doesn't exist");
    expect(crashed.causeMessage).toContain("SIGSEGV");
  });

  test("classifies polluted sandbox browser path distinctly", () => {
    const pollutedPath = `/var/folders/x/${CURSOR_SANDBOX_BROWSER_CACHE_MARKER}/playwright`;
    const polluted = classifyAutomationBrowserLaunchFailure(
      new Error("browserType.launch: Failed to launch browser"),
      "launch",
      pollutedPath,
    );
    const generic = classifyAutomationBrowserLaunchFailure(
      new Error("browserType.launch: Failed to launch browser"),
      "launch",
      "/tmp/ms-playwright-host-cache",
    );

    expect(polluted.failureMode).toBe("BROWSER_PATH_POLLUTED");
    expect(generic.failureMode).toBe("BROWSER_LAUNCH_FAILED");
    expect(polluted.failureMode).not.toBe(generic.failureMode);
    expect(polluted.browsersPath).toBe(pollutedPath);
  });

  test("classifies context and page stage failures distinctly", () => {
    const contextFailure = classifyAutomationBrowserLaunchFailure(
      new Error("Failed to create browser context"),
      "context",
    );
    const pageFailure = classifyAutomationBrowserLaunchFailure(
      new Error("Failed to open new page"),
      "page",
    );

    expect(contextFailure.failureMode).toBe("BROWSER_CONTEXT_FAILED");
    expect(pageFailure.failureMode).toBe("BROWSER_PAGE_FAILED");
    expect(contextFailure.stage).toBe("context");
    expect(pageFailure.stage).toBe("page");
  });

  test("formats message and details without dropping failureMode", () => {
    const failure = classifyAutomationBrowserLaunchFailure(
      new Error("Executable doesn't exist"),
      "launch",
    );
    const details = automationBrowserLaunchFailureToDetails(failure);
    const message = formatAutomationBrowserLaunchFailureMessage(failure);

    expect(message).toBe("Unable to launch automation browser (BROWSER_EXECUTABLE_MISSING).");
    expect(details.failureMode).toBe("BROWSER_EXECUTABLE_MISSING");
    expect(details.causeMessage).toBe("Executable doesn't exist");
    expect(details.stage).toBe("launch");
  });

  test("redacts secrets and user-home paths from causeMessage and browsersPath", () => {
    const apiKey = `${AUTH_KEY_PREFIX}ABCDEFGHijklmnop`;
    const providerSecret = "sk-proj-LEAKED_PROVIDER_SECRET_VALUE";
    const homePath = "/Users/example-user/Library/Caches/ms-playwright";
    const failure = classifyAutomationBrowserLaunchFailure(
      new Error(
        `browserType.launch: failed Bearer ${apiKey} key=${providerSecret} OPENAI_API_KEY=${providerSecret} at ${homePath}/chromium`,
      ),
      "launch",
      homePath,
    );

    expect(failure.failureMode).toBe("BROWSER_LAUNCH_FAILED");
    expect(failure.causeMessage).not.toContain(apiKey);
    expect(failure.causeMessage).not.toContain(providerSecret);
    expect(failure.causeMessage).not.toContain("example-user");
    expect(failure.causeMessage).not.toContain("/Users/");
    expect(failure.causeMessage).toContain("[REDACTED]");
    expect(failure.causeMessage).toContain("~/Library/Caches/ms-playwright");
    expect(failure.browsersPath).toBe("~/Library/Caches/ms-playwright");
    expect(JSON.stringify(automationBrowserLaunchFailureToDetails(failure))).not.toContain(
      providerSecret,
    );
  });

  test("keeps polluted-path classification when home prefix is scrubbed in browsersPath", () => {
    const pollutedHomePath = `/Users/example-user/Library/Caches/${CURSOR_SANDBOX_BROWSER_CACHE_MARKER}/playwright`;
    const polluted = classifyAutomationBrowserLaunchFailure(
      new Error("browserType.launch: Failed to launch browser"),
      "launch",
      pollutedHomePath,
    );

    expect(polluted.failureMode).toBe("BROWSER_PATH_POLLUTED");
    expect(polluted.browsersPath).toBe(
      `~/Library/Caches/${CURSOR_SANDBOX_BROWSER_CACHE_MARKER}/playwright`,
    );
    expect(polluted.browsersPath).not.toContain("example-user");
  });
});

describe("sanitizeAutomationBrowserLaunchDiagnostic", () => {
  test("redacts env-style secret assignments without dropping safe diagnostic text", () => {
    const scrubbed = sanitizeAutomationBrowserLaunchDiagnostic(
      "ENOENT PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright BAO_AUTH_SETUP_TOKEN=super-secret-value",
    );
    expect(scrubbed).toContain("ENOENT");
    expect(scrubbed).toContain("PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright");
    expect(scrubbed).not.toContain("super-secret-value");
    expect(scrubbed).toContain("[REDACTED]");
  });
});
