import { resumeDataSchema } from "@bao/shared/schemas/resume.schema";
import type { ResumeData } from "@bao/shared/types/resume";

const FIXTURE_HOST = "127.0.0.1" as const;
const FIXTURE_PAGE_CONTENT_TYPE = "text/html; charset=utf-8" as const;
const FIXTURE_SUBMISSION_CONTENT_TYPE = "text/plain; charset=utf-8" as const;
const FIXTURE_SUBMISSION_CONFIRMATION_TEXT = "Thank you" as const;

/**
 * Submitted payload captured from the deterministic job-apply fixture.
 */
export interface SubmittedJobApplyFixturePayload {
  fields: Record<string, string>;
  resumeFileName: string | null;
}

/**
 * Options supported by the job-apply verification fixture server.
 */
export interface JobApplyFixtureServerOptions {
  submissionDelayMs?: number;
  includeCustomQuestionFields?: boolean;
}

/**
 * Handle returned by the deterministic job-apply fixture server.
 */
export interface JobApplyFixtureServerHandle {
  baseUrl: string;
  port: number;
  submissions: SubmittedJobApplyFixturePayload[];
  stop(): Promise<void>;
}

const fieldNameSelector = (tagName: string, fieldName: string): string =>
  [tagName, "[name='", fieldName, "']"].join("");

const collectSubmittedFields = (formData: FormData): SubmittedJobApplyFixturePayload => {
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      fields[key] = value;
    }
  }

  const resumeEntry = formData.get("resume");
  return {
    fields,
    resumeFileName: resumeEntry instanceof File ? resumeEntry.name : null,
  };
};

const createSubmissionResponse = async (delayMs: number): Promise<Response> => {
  if (delayMs > 0) {
    await Bun.sleep(delayMs);
  }

  return new Response(FIXTURE_SUBMISSION_CONFIRMATION_TEXT, {
    headers: {
      "content-type": FIXTURE_SUBMISSION_CONTENT_TYPE,
    },
  });
};

const buildCustomQuestionMarkup = (): string => `
      <label for="candidate-work-authorization">Work authorization</label>
      <select id="candidate-work-authorization" name="workAuthorization">
        <option value="">Select one</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      <fieldset>
        <legend>Remote preference</legend>
        <label>
          <input type="radio" name="remotePreference" value="Remote" />
          Remote
        </label>
        <label>
          <input type="radio" name="remotePreference" value="Hybrid" />
          Hybrid
        </label>
      </fieldset>

      <label>
        <input type="checkbox" name="termsAccepted" value="yes" />
        I confirm the application details are correct
      </label>
`;

const buildJobApplyFixtureHtml = (
  origin: string,
  options: JobApplyFixtureServerOptions,
): string => `<!doctype html>
<html lang="en">
  <body>
    <form action="${origin}/submit" method="post" enctype="multipart/form-data">
      <label for="candidate-name">Full name</label>
      <input id="candidate-name" name="name" type="text" />

      <label for="candidate-email">Email</label>
      <input id="candidate-email" name="email" type="email" />

      <label for="candidate-phone">Phone</label>
      <input id="candidate-phone" name="phone" type="tel" />

      <label for="candidate-resume">Resume</label>
      <input id="candidate-resume" name="resume" type="file" />

      <label for="candidate-cover-letter">Cover letter</label>
      <textarea id="candidate-cover-letter" name="coverLetter"></textarea>

${options.includeCustomQuestionFields ? buildCustomQuestionMarkup() : ""}

      <button type="submit">Submit application</button>
    </form>
  </body>
</html>`;

/**
 * Create a deterministic resume payload for verification and integration tests.
 *
 * @returns Valid resume payload accepted by the resume API.
 */
export function createVerificationResumePayload(): Omit<ResumeData, "id"> {
  return resumeDataSchema.parse({
    name: "Bao Builder Resume",
    personalInfo: {
      name: "Bao Builder",
      email: "bao@example.com",
      phone: "555-0100",
    },
    summary: "Gameplay engineer focused on deterministic verification paths.",
    experience: [],
    education: [],
    skills: {
      technical: ["TypeScript", "Bun"],
    },
    projects: [],
    gamingExperience: {},
    template: "modern",
    theme: "light",
    isDefault: false,
  });
}

/**
 * Build the selector map required by the lower-level job-apply script fixture test.
 *
 * @returns Selector map keyed by custom answer field.
 */
export function createJobApplyFixtureSelectorMap(): Record<string, string[]> {
  return {
    workAuthorization: [fieldNameSelector("select", "workAuthorization")],
    remotePreference: [fieldNameSelector("input", "remotePreference")],
    termsAccepted: [fieldNameSelector("input", "termsAccepted")],
  };
}

/**
 * Start a deterministic job-apply fixture server for automation verification.
 *
 * @param options Server behavior options.
 * @returns Running fixture server handle.
 */
export function startJobApplyFixtureServer(
  options: JobApplyFixtureServerOptions = {},
): JobApplyFixtureServerHandle {
  const submissions: SubmittedJobApplyFixturePayload[] = [];
  let serverPort = 0;

  const server = Bun.serve({
    hostname: FIXTURE_HOST,
    port: 0,
    async fetch(request): Promise<Response> {
      const requestUrl = new URL(request.url);
      if (request.method === "POST" && requestUrl.pathname === "/submit") {
        const formData = await request.formData();
        submissions.push(collectSubmittedFields(formData));
        return createSubmissionResponse(options.submissionDelayMs ?? 0);
      }

      return new Response(
        buildJobApplyFixtureHtml(`http://${FIXTURE_HOST}:${serverPort}`, options),
        {
          headers: {
            "content-type": FIXTURE_PAGE_CONTENT_TYPE,
          },
        },
      );
    },
  });

  serverPort = server.port ?? 0;

  return {
    baseUrl: `http://${FIXTURE_HOST}:${serverPort}`,
    port: serverPort,
    submissions,
    async stop(): Promise<void> {
      await server.stop(true);
    },
  };
}
