import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateId } from "@bao/shared";
import { runRpaScript } from "./rpa-runner";

type SubmittedPayload = {
  fields: Record<string, string>;
  resumeFileName: string | null;
};

const TEMP_DIRECTORY_PREFIX = "bao-job-apply-script-";
const TEST_RESUME_FILE_NAME = "candidate-resume.pdf";
const TEST_RESUME_PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const JOB_APPLY_SCRIPT_TEST_TIMEOUT_MS = 60_000;
const FORM_FIELD_NAME_WORK_AUTHORIZATION = "workAuthorization";
const FORM_FIELD_NAME_REMOTE_PREFERENCE = "remotePreference";
const FORM_FIELD_NAME_TERMS_ACCEPTED = "termsAccepted";
const FIXTURE_PAGE_CONTENT_TYPE = "text/html; charset=utf-8";
const SUBMISSION_CONTENT_TYPE = "text/plain; charset=utf-8";
const SUBMISSION_CONFIRMATION_TEXT = "Thank you";

setDefaultTimeout(JOB_APPLY_SCRIPT_TEST_TIMEOUT_MS);

const createTempDirectory = (): string => mkdtempSync(join(tmpdir(), TEMP_DIRECTORY_PREFIX));

const writeTempResumeFile = async (directory: string): Promise<string> => {
  const resumePath = join(directory, TEST_RESUME_FILE_NAME);
  await Bun.write(resumePath, TEST_RESUME_PDF_BYTES);
  return resumePath;
};

const fieldNameSelector = (tagName: string, fieldName: string): string =>
  [tagName, "[name='", fieldName, "']"].join("");

const collectSubmittedFields = (formData: FormData): SubmittedPayload => {
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

const createSubmissionResponse = (): Response =>
  new Response(SUBMISSION_CONFIRMATION_TEXT, {
    headers: {
      "content-type": SUBMISSION_CONTENT_TYPE,
    },
  });

const createFixtureResponse = (origin: string): Response =>
  new Response(buildJobApplyFixtureHtml(origin), {
    headers: {
      "content-type": FIXTURE_PAGE_CONTENT_TYPE,
    },
  });

const buildJobApplyScriptInput = (serverPort: number, resumeFilePath: string) => ({
  jobUrl: `http://127.0.0.1:${serverPort}/`,
  resume: {
    personalInfo: {
      name: "Bao Builder",
      email: "bao@example.com",
      phone: "555-0100",
    },
  },
  resumeFilePath,
  coverLetter: {
    content: {
      introduction: "I am excited to apply for this gameplay engineering role.",
    },
  },
  customAnswers: {
    [FORM_FIELD_NAME_WORK_AUTHORIZATION]: "Yes",
    [FORM_FIELD_NAME_REMOTE_PREFERENCE]: "Remote",
    [FORM_FIELD_NAME_TERMS_ACCEPTED]: "yes",
  },
  selectorMap: {
    [FORM_FIELD_NAME_WORK_AUTHORIZATION]: [
      fieldNameSelector("select", FORM_FIELD_NAME_WORK_AUTHORIZATION),
    ],
    [FORM_FIELD_NAME_REMOTE_PREFERENCE]: [
      fieldNameSelector("input", FORM_FIELD_NAME_REMOTE_PREFERENCE),
    ],
    [FORM_FIELD_NAME_TERMS_ACCEPTED]: [fieldNameSelector("input", FORM_FIELD_NAME_TERMS_ACCEPTED)],
  },
});

const assertSubmittedPayload = (payload: SubmittedPayload | null): void => {
  expect(payload).not.toBeNull();
  expect(payload?.resumeFileName).toBe(TEST_RESUME_FILE_NAME);
  expect(payload?.fields.name).toBe("Bao Builder");
  expect(payload?.fields.email).toBe("bao@example.com");
  expect(payload?.fields.phone).toBe("555-0100");
  expect(payload?.fields.coverLetter).toContain("excited to apply");
  expect(payload?.fields[FORM_FIELD_NAME_WORK_AUTHORIZATION]).toBe("Yes");
  expect(payload?.fields[FORM_FIELD_NAME_REMOTE_PREFERENCE]).toBe("Remote");
  expect(payload?.fields[FORM_FIELD_NAME_TERMS_ACCEPTED]).toBe("yes");
};

const createJobApplyFixtureServer = (
  onSubmit: (payload: SubmittedPayload) => void,
): ReturnType<typeof Bun.serve> => {
  let serverPort = 0;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request): Response | Promise<Response> {
      const url = new URL(request.url);

      if (request.method === "POST" && url.pathname === "/submit") {
        return request.formData().then((formData) => {
          onSubmit(collectSubmittedFields(formData));
          return createSubmissionResponse();
        });
      }

      return createFixtureResponse(`http://127.0.0.1:${serverPort}`);
    },
  });
  serverPort = server.port ?? 0;
  return server;
};

async function runJobApplyScriptFixture(tempDirectory: string): Promise<{
  execution: Awaited<ReturnType<typeof runRpaScript>>;
  submittedPayload: SubmittedPayload | null;
}> {
  const outputDirectory = join(tempDirectory, "output");
  const resumeFilePath = await writeTempResumeFile(tempDirectory);
  let submittedPayload: SubmittedPayload | null = null;
  const server = createJobApplyFixtureServer((payload) => {
    submittedPayload = payload;
  });

  return Promise.resolve()
    .then(async () => {
      const execution = await runRpaScript({
        scriptId: "job-apply",
        scriptInput: buildJobApplyScriptInput(server.port ?? 0, resumeFilePath),
        executionContext: {
          runId: generateId(),
          timeoutMs: JOB_APPLY_SCRIPT_TEST_TIMEOUT_MS,
          outputDir: outputDirectory,
        },
      });

      return {
        execution,
        submittedPayload,
      };
    })
    .finally(async () => {
      await server.stop(true);
    });
}

const buildJobApplyFixtureHtml = (origin: string): string => `<!doctype html>
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

      <button type="submit">Submit application</button>
    </form>
  </body>
</html>`;

describe("job-apply script", () => {
  test("uploads a real resume artifact and fills select, radio, and checkbox answers", async () => {
    const tempDirectory = createTempDirectory();
    await Promise.resolve()
      .then(async () => {
        const { execution, submittedPayload } = await runJobApplyScriptFixture(tempDirectory);
        expect(execution.error).toBeNull();
        expect(execution.result?.success).toBe(true);
        assertSubmittedPayload(submittedPayload);
      })
      .finally(() => {
        rmSync(tempDirectory, { recursive: true, force: true });
      });
  });
});
