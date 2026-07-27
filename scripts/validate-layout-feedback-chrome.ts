import { readdir, readFile } from "node:fs/promises";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const LAYOUTS_DIRECTORY = "packages/client/layouts";

/**
 * Shared feedback chrome every layout must mount.
 *
 * `useToast` is a global store rendered by exactly one host component. A layout
 * that omits the host silently swallows every `toast.success` / `toast.error`
 * raised by the pages it hosts: the call succeeds, the state updates, and
 * nothing reaches the screen. That is exactly how the setup wizard shipped —
 * `auth-shell.vue` had no host, so provider-test results, clipboard
 * confirmations, and completion failures were all invisible on the app's first
 * screen while every unit test and validator stayed green.
 *
 * Feedback chrome is a layout contract, not a page concern. Any new layout must
 * mount it or explain itself here.
 */
const REQUIRED_LAYOUT_CHROME = [
  {
    component: "ToastContainer",
    reason:
      "useToast state is only visible through ToastContainer; a layout without it drops every toast raised by its pages.",
  },
] as const;

const VUE_EXTENSION = ".vue";

/**
 * Lists the Vue layout files that Nuxt will register.
 */
const readLayoutFileNames = async (): Promise<string[]> => {
  const entries = await readdir(LAYOUTS_DIRECTORY, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(VUE_EXTENSION))
    .map((entry) => entry.name)
    .sort();
};

/**
 * Reports whether a layout's template mounts a component by tag name.
 *
 * Matches both the plain tag and the Nuxt `Lazy` prefix, in self-closing and
 * paired form, so `<ToastContainer />`, `<ToastContainer>`, and
 * `<LazyToastContainer />` all count as mounted.
 */
const mountsComponent = (content: string, component: string): boolean =>
  new RegExp(`<(?:Lazy)?${component}(?:\\s|/|>)`, "u").test(content);

/** A layout source file paired with its repo-relative path. */
export type LayoutSource = {
  filePath: string;
  content: string;
};

/**
 * Pure gate over already-read layout sources.
 *
 * Exported so the gate can be exercised against synthetic layouts — including
 * the empty-input case, which must fail rather than vacuously pass.
 */
export const collectMissingLayoutChrome = (
  layouts: readonly LayoutSource[],
): ValidationViolation[] => {
  if (layouts.length === 0) {
    return [
      {
        filePath: LAYOUTS_DIRECTORY,
        line: 1,
        message: "No Nuxt layouts found — the layout chrome gate would silently pass.",
      },
    ];
  }

  const violations: ValidationViolation[] = [];
  for (const layout of layouts) {
    for (const chrome of REQUIRED_LAYOUT_CHROME) {
      if (mountsComponent(layout.content, chrome.component)) {
        continue;
      }
      violations.push({
        filePath: layout.filePath,
        line: 1,
        message: `Layout does not mount <${chrome.component}>. ${chrome.reason}`,
      });
    }
  }

  return violations;
};

/**
 * Layout feedback-chrome gate: every Nuxt layout mounts the shared toast host
 * so no layout can silently swallow user-facing feedback.
 */
export const collectLayoutFeedbackChromeViolations = async (): Promise<ValidationViolation[]> => {
  const layoutFileNames = await readLayoutFileNames();
  const layouts = await Promise.all(
    layoutFileNames.map(async (fileName) => ({
      filePath: `${LAYOUTS_DIRECTORY}/${fileName}`,
      content: await readFile(`${LAYOUTS_DIRECTORY}/${fileName}`, "utf8"),
    })),
  );

  return collectMissingLayoutChrome(layouts);
};

if (import.meta.main) {
  await reportViolations(
    "Layout feedback chrome validation failed:",
    await collectLayoutFeedbackChromeViolations(),
    "Layout feedback chrome validation passed: every layout mounts the shared toast host.",
  );
}
