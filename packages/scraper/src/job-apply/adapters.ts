/**
 * Supported ATS adapter identifiers for job-apply automation.
 */
export type JobApplyAdapterId = "greenhouse" | "lever" | "generic";

/**
 * Selector buckets used by the job-apply runtime.
 */
export interface JobApplySelectorBundle {
  /** Full-name selector candidates. */
  readonly fullName: readonly string[];
  /** First-name selector candidates. */
  readonly firstName: readonly string[];
  /** Last-name selector candidates. */
  readonly lastName: readonly string[];
  /** Email selector candidates. */
  readonly email: readonly string[];
  /** Phone selector candidates. */
  readonly phone: readonly string[];
  /** Resume-upload selector candidates. */
  readonly resume: readonly string[];
  /** Cover-letter selector candidates. */
  readonly coverLetter: readonly string[];
  /** Submit-action selector candidates. */
  readonly submit: readonly string[];
}

/**
 * ATS adapter definition used by the Bun job-apply runtime.
 */
export interface JobApplyAdapter {
  /** Stable adapter identifier. */
  readonly id: JobApplyAdapterId;
  /** URL fragments used to detect the adapter from the current page URL. */
  readonly urlHints: readonly string[];
  /** Selector bundle applied by the runtime. */
  readonly selectors: JobApplySelectorBundle;
}

/**
 * Stable step count used for progress emission.
 */
export const JOB_APPLY_TOTAL_STEPS = 11;

/**
 * Confirmation phrases used when verifying submission.
 */
export const JOB_APPLY_CONFIRMATION_PHRASES = [
  "thank you",
  "application received",
  "application submitted",
  "successfully submitted",
  "we received your application",
  "application complete",
  "submission confirmed",
] as const;

const inputSelectorByName = (fieldName: string): string => `input[name='${fieldName}']`;

const textareaSelectorByName = (fieldName: string): string => `textarea[name='${fieldName}']`;

const inputSelectorByType = (inputType: string): string => `input[type='${inputType}']`;

const inputSelectorByAutocomplete = (autocompleteValue: string): string =>
  `input[autocomplete='${autocompleteValue}']`;

const inputSelectorByDataSource = (sourceName: string): string =>
  `input[data-source='${sourceName}']`;

const buttonSelectorByType = (buttonType: string): string => `button[type='${buttonType}']`;

const buttonSelectorByText = (buttonText: string): string => `button:has-text('${buttonText}')`;

const greenhouseFieldName = (fieldName: string): string => `job_application[${fieldName}]`;

const leverFieldName = (fieldName: string): string => `cards[0][${fieldName}]`;

const GREENHOUSE_ADAPTER: JobApplyAdapter = {
  id: "greenhouse",
  urlHints: ["greenhouse.io", "boards.greenhouse.io"],
  selectors: {
    fullName: [],
    firstName: ["#first_name", inputSelectorByName(greenhouseFieldName("first_name"))],
    lastName: [
      "#last_name",
      inputSelectorByName(greenhouseFieldName("last_name")),
      inputSelectorByName("lastName"),
      inputSelectorByName("last_name"),
      inputSelectorByAutocomplete("family-name"),
    ],
    email: ["#email", inputSelectorByName(greenhouseFieldName("email"))],
    phone: ["#phone", inputSelectorByName(greenhouseFieldName("phone"))],
    resume: [
      inputSelectorByDataSource("paste"),
      inputSelectorByName(greenhouseFieldName("resume")),
    ],
    coverLetter: [
      textareaSelectorByName(greenhouseFieldName("cover_letter")),
      textareaSelectorByName("cover_letter"),
      "#cover_letter",
      textareaSelectorByName("coverLetter"),
    ],
    submit: ["#submit_app", buttonSelectorByText("Submit application")],
  },
};

const LEVER_ADAPTER: JobApplyAdapter = {
  id: "lever",
  urlHints: ["lever.co", "jobs.lever.co"],
  selectors: {
    fullName: [inputSelectorByName("name"), inputSelectorByName(leverFieldName("field0"))],
    firstName: [],
    lastName: [],
    email: [inputSelectorByName("email"), inputSelectorByName(leverFieldName("field1"))],
    phone: [inputSelectorByName("phone"), inputSelectorByName(leverFieldName("field2"))],
    resume: [inputSelectorByName("resume"), `.resume-upload ${inputSelectorByType("file")}`],
    coverLetter: [
      textareaSelectorByName("comments"),
      textareaSelectorByName("cover_letter"),
      textareaSelectorByName("coverLetter"),
    ],
    submit: [buttonSelectorByText("Submit Application"), buttonSelectorByType("submit")],
  },
};

const GENERIC_ADAPTER: JobApplyAdapter = {
  id: "generic",
  urlHints: [],
  selectors: {
    fullName: [
      inputSelectorByName("fullName"),
      inputSelectorByName("name"),
      inputSelectorByAutocomplete("name"),
      inputSelectorByAutocomplete("given-name"),
    ],
    firstName: [inputSelectorByName("firstName"), inputSelectorByAutocomplete("given-name")],
    lastName: [inputSelectorByName("lastName"), inputSelectorByAutocomplete("family-name")],
    email: [
      inputSelectorByType("email"),
      inputSelectorByName("email"),
      inputSelectorByAutocomplete("email"),
    ],
    phone: [
      inputSelectorByType("tel"),
      inputSelectorByName("phone"),
      inputSelectorByAutocomplete("tel"),
    ],
    resume: [inputSelectorByType("file"), inputSelectorByName("resume"), inputSelectorByName("cv")],
    coverLetter: [
      textareaSelectorByName("coverLetter"),
      textareaSelectorByName("cover_letter"),
      "textarea",
    ],
    submit: [
      buttonSelectorByType("submit"),
      inputSelectorByType("submit"),
      buttonSelectorByText("Apply"),
    ],
  },
};

/**
 * Stable ordered adapter list used for ATS detection.
 */
export const JOB_APPLY_ADAPTERS: readonly JobApplyAdapter[] = [
  GREENHOUSE_ADAPTER,
  LEVER_ADAPTER,
  GENERIC_ADAPTER,
];

/**
 * Resolves the ATS adapter for a URL.
 *
 * @param currentUrl Current page URL after any hosted-form redirect.
 * @returns Matching adapter definition.
 */
export const resolveJobApplyAdapter = (currentUrl: string): JobApplyAdapter => {
  const normalizedUrl = currentUrl.toLowerCase();
  return (
    JOB_APPLY_ADAPTERS.find((adapter) =>
      adapter.urlHints.some((hint) => normalizedUrl.includes(hint)),
    ) ?? GENERIC_ADAPTER
  );
};
