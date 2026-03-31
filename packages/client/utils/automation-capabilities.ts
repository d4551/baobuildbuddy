interface AutomationCapabilityIssuesLike {
  readonly issues?: unknown;
}

/**
 * Normalizes capability issue notes from runtime payloads that may omit the issues array.
 */
export function resolveAutomationCapabilityIssues(
  capability: AutomationCapabilityIssuesLike,
): string[] {
  if (!Array.isArray(capability.issues)) {
    return [];
  }

  return capability.issues.filter(
    (issue): issue is string => typeof issue === "string" && issue.trim().length > 0,
  );
}
