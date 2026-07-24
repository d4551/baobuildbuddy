import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateId } from "@bao/shared/utils/validation";
import {
  createJobApplyFixtureSelectorMap,
  type SubmittedJobApplyFixturePayload,
  startJobApplyFixtureServer,
} from "../../test-support/automation/job-apply-fixture";
import { TEST_RESUME_PDF_BYTES } from "../../test-support/constants/pdf-test-bytes";
import { runRpaScript } from "./rpa-runner-protocol";

// Real Playwright apply — never inherit the verification stub into child RPA processes.
delete process.env.BAO_ENABLE_AUTOMATION_VERIFY;
delete Bun.env.BAO_ENABLE_AUTOMATION_VERIFY;

const TEMP_DIRECTORY_PREFIX = "bao-job-apply-script-";
const TEST_RESUME_FILE_NAME = "candidate-resume.pdf";
const JOB_APPLY_SCRIPT_TEST_TIMEOUT_MS = 60_000;
const FORM_FIELD_NAME_WORK_AUTHORIZATION = "workAuthorization";
const FORM_FIELD_NAME_REMOTE_PREFERENCE = "remotePreference";
const FORM_FIELD_NAME_TERMS_ACCEPTED = "termsAccepted";

setDefaultTimeout(JOB_APPLY_SCRIPT_TEST_TIMEOUT_MS);

const createTempDirectory = (): string => mkdtempSync(join(tmpdir(), TEMP_DIRECTORY_PREFIX));

const writeTempResumeFile = async (directory: string): Promise<string> => {
  const resumePath = join(directory, TEST_RESUME_FILE_NAME);
  await Bun.write(resumePath, TEST_RESUME_PDF_BYTES);
  return resumePath;
};

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
  selectorMap: createJobApplyFixtureSelectorMap(),
});

const assertSubmittedPayload = (payload: SubmittedJobApplyFixturePayload | null): void => {
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

async function runJobApplyScriptFixture(tempDirectory: string): Promise<{
  execution: Awaited<ReturnType<typeof runRpaScript>>;
  submittedPayload: SubmittedJobApplyFixturePayload | null;
}> {
  const outputDirectory = join(tempDirectory, "output");
  const resumeFilePath = await writeTempResumeFile(tempDirectory);
  const server = startJobApplyFixtureServer({
    includeCustomQuestionFields: true,
  });

  const runTest = async () => {
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
      submittedPayload: server.submissions[0] ?? null,
    };
  };

  return Promise.resolve()
    .then(runTest)
    .then(
      async (value) => {
        await server.stop();
        return value;
      },
      async (error) => {
        await server.stop();
        throw error;
      },
    );
}

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
