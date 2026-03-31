import { API_ERROR_INVALID_COVER_LETTER_PAYLOAD, API_ERROR_INVALID_INTERVIEW_SESSION_PAYLOAD, API_ERROR_INVALID_PORTFOLIO_PAYLOAD, API_ERROR_INVALID_PORTFOLIO_PROJECT_PAYLOAD, API_ERROR_INVALID_RESUME_PAYLOAD, API_ERROR_INVALID_SKILL_MAPPING_PAYLOAD } from "@bao/shared/constants/api-errors";
import { asString, isRecord } from "@bao/shared/utils/type-guards";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { coverLetters } from "../db/schema/cover-letters";
import { interviewSessions } from "../db/schema/interviews";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import type { BaoExportData } from "./data-service-contracts";
import {
  runIgnoringErrors,
  runTasksSequentially,
  runWithErrorHandler,
} from "./data-service-helpers";
import {
  parseChatHistoryInsert,
  parseCoverLetterInsert,
  parseInterviewSessionInsert,
  parsePortfolioInsert,
  parsePortfolioProjectInsert,
  parseResumeInsert,
  parseSkillMappingInsert,
} from "./data-service-parsers";

export const importResumesSection = async (
  data: BaoExportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!(data.resumes?.length > 0)) {
    return;
  }

  let count = 0;
  const tasks = data.resumes.map(
    (resume) => async () =>
      runWithErrorHandler(
        async () => {
          const parsedResume = parseResumeInsert(resume);
          if (!parsedResume) throw new Error(API_ERROR_INVALID_RESUME_PAYLOAD);
          await db
            .insert(resumes)
            .values(parsedResume)
            .onConflictDoUpdate({
              target: resumes.id,
              set: { ...parsedResume, updatedAt: new Date().toISOString() },
            });
          count++;
        },
        (message) => {
          const record = isRecord(resume) ? resume : {};
          errors.push(`Resume "${asString(record.name) ?? "unknown"}" import failed: ${message}`);
        },
      ),
  );
  await runTasksSequentially(tasks);
  imported.resumes = count;
};

export const importCoverLettersSection = async (
  data: BaoExportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!(data.coverLetters?.length > 0)) {
    return;
  }

  let count = 0;
  const tasks = data.coverLetters.map(
    (coverLetter) => async () =>
      runWithErrorHandler(
        async () => {
          const parsedCoverLetter = parseCoverLetterInsert(coverLetter);
          if (!parsedCoverLetter) throw new Error(API_ERROR_INVALID_COVER_LETTER_PAYLOAD);
          await db
            .insert(coverLetters)
            .values(parsedCoverLetter)
            .onConflictDoUpdate({
              target: coverLetters.id,
              set: { ...parsedCoverLetter, updatedAt: new Date().toISOString() },
            });
          count++;
        },
        (message) => {
          errors.push(`Cover letter import failed: ${message}`);
        },
      ),
  );
  await runTasksSequentially(tasks);
  imported.coverLetters = count;
};

export const importPortfolioProjectsSection = async (
  data: BaoExportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!(data.portfolioProjects?.length > 0)) {
    return;
  }

  if (data.portfolio) {
    await runIgnoringErrors(async () => {
      const portfolioRow = parsePortfolioInsert(data.portfolio);
      if (!portfolioRow) throw new Error(API_ERROR_INVALID_PORTFOLIO_PAYLOAD);
      await db.insert(portfolios).values(portfolioRow).onConflictDoNothing();
    });
  }

  let count = 0;
  const tasks = data.portfolioProjects.map(
    (project) => async () =>
      runWithErrorHandler(
        async () => {
          const parsedProject = parsePortfolioProjectInsert(project);
          if (!parsedProject) throw new Error(API_ERROR_INVALID_PORTFOLIO_PROJECT_PAYLOAD);
          await db
            .insert(portfolioProjects)
            .values(parsedProject)
            .onConflictDoUpdate({
              target: portfolioProjects.id,
              set: { ...parsedProject, updatedAt: new Date().toISOString() },
            });
          count++;
        },
        (message) => {
          const record = isRecord(project) ? project : {};
          errors.push(
            `Portfolio project "${asString(record.title) ?? "unknown"}" import failed: ${message}`,
          );
        },
      ),
  );
  await runTasksSequentially(tasks);
  imported.portfolioProjects = count;
};

export const importInterviewSessionsSection = async (
  data: BaoExportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!(data.interviewSessions?.length > 0)) {
    return;
  }

  let count = 0;
  const tasks = data.interviewSessions.map(
    (session) => async () =>
      runWithErrorHandler(
        async () => {
          const parsedSession = parseInterviewSessionInsert(session);
          if (!parsedSession) throw new Error(API_ERROR_INVALID_INTERVIEW_SESSION_PAYLOAD);
          await db
            .insert(interviewSessions)
            .values(parsedSession)
            .onConflictDoUpdate({
              target: interviewSessions.id,
              set: { ...parsedSession, updatedAt: new Date().toISOString() },
            });
          count++;
        },
        (message) => {
          errors.push(`Interview session import failed: ${message}`);
        },
      ),
  );
  await runTasksSequentially(tasks);
  imported.interviewSessions = count;
};

export const importSkillMappingsSection = async (
  data: BaoExportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!(data.skillMappings?.length > 0)) {
    return;
  }

  let count = 0;
  const tasks = data.skillMappings.map(
    (skill) => async () =>
      runWithErrorHandler(
        async () => {
          const parsedSkill = parseSkillMappingInsert(skill);
          if (!parsedSkill) throw new Error(API_ERROR_INVALID_SKILL_MAPPING_PAYLOAD);
          await db
            .insert(skillMappings)
            .values(parsedSkill)
            .onConflictDoUpdate({
              target: skillMappings.id,
              set: { ...parsedSkill, updatedAt: new Date().toISOString() },
            });
          count++;
        },
        (message) => {
          errors.push(`Skill mapping import failed: ${message}`);
        },
      ),
  );
  await runTasksSequentially(tasks);
  imported.skillMappings = count;
};

export const importChatHistorySection = async (
  data: BaoExportData,
  imported: Record<string, number>,
): Promise<void> => {
  if (!(data.chatHistory?.length > 0)) {
    return;
  }

  let count = 0;
  const tasks = data.chatHistory.map(
    (message) => async () =>
      runIgnoringErrors(async () => {
        const parsedMessage = parseChatHistoryInsert(message);
        if (!parsedMessage) {
          return;
        }
        await db.insert(chatHistory).values(parsedMessage).onConflictDoNothing();
        count++;
      }),
  );
  await runTasksSequentially(tasks);
  imported.chatHistory = count;
};
