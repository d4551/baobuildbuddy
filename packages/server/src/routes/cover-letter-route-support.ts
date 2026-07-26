import {
  API_ERROR_COVER_LETTER_NOT_FOUND,
  API_ERROR_CREATE_COVER_LETTER,
} from "@bao/shared/constants/api-errors";
import {
  COVER_LETTER_DEFAULT_TEMPLATE,
  type CoverLetterTemplate,
  isCoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import { HTTP_STATUS_CREATED, HTTP_STATUS_NOT_FOUND } from "@bao/shared/constants/http";
import { generateId } from "@bao/shared/utils/validation";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { gamificationService } from "../services/gamification-service";
import type { RouteSetState } from "../types/route-state";

export const normalizeTemplate = (value: string | undefined): CoverLetterTemplate =>
  isCoverLetterTemplate(value) ? value : COVER_LETTER_DEFAULT_TEMPLATE;

export const listCoverLetters = async () =>
  db.select().from(coverLetters).orderBy(desc(coverLetters.createdAt));

export const createCoverLetter = async (body: {
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  content?: Record<string, unknown>;
  template?: string;
}) => {
  const coverLetter = {
    id: generateId(),
    company: body.company,
    position: body.position,
    jobInfo: body.jobInfo || {},
    content: body.content || {},
    template: normalizeTemplate(body.template),
  };

  await db.insert(coverLetters).values(coverLetter);

  // Read the row back rather than echoing the insert payload: `createdAt` /
  // `updatedAt` are database defaults, so echoing would return a cover letter
  // without the timestamps that every read path includes. Reading back also
  // proves the insert actually landed, matching the resume/portfolio services.
  const [created] = await db.select().from(coverLetters).where(eq(coverLetters.id, coverLetter.id));
  if (!created) {
    throw new Error(API_ERROR_CREATE_COVER_LETTER);
  }

  gamificationService.trackActionFireAndForget(
    "coverLettersGenerated",
    ROUTE_GAMIFICATION_XP.coverLettersGenerated,
    "cover_letter_created",
  );

  return { coverLetter: created, statusCode: HTTP_STATUS_CREATED };
};

export const getCoverLetterById = async (id: string, set: RouteSetState) => {
  const rows = await db.select().from(coverLetters).where(eq(coverLetters.id, id));
  if (rows.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return null;
  }
  return rows[0];
};

export const updateCoverLetter = async (
  id: string,
  body: {
    company?: string;
    position?: string;
    jobInfo?: Record<string, unknown>;
    content?: Record<string, unknown>;
    template?: string;
  },
  set: RouteSetState,
) => {
  const existing = await db.select().from(coverLetters).where(eq(coverLetters.id, id));
  if (existing.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.company !== undefined) updates.company = body.company;
  if (body.position !== undefined) updates.position = body.position;
  if (body.jobInfo !== undefined) updates.jobInfo = body.jobInfo;
  if (body.content !== undefined) updates.content = body.content;
  if (body.template !== undefined) updates.template = normalizeTemplate(body.template);

  await db.update(coverLetters).set(updates).where(eq(coverLetters.id, id));
  const updatedRows = await db.select().from(coverLetters).where(eq(coverLetters.id, id));
  return updatedRows[0];
};

export const deleteCoverLetter = async (id: string, set: RouteSetState) => {
  const existing = await db.select().from(coverLetters).where(eq(coverLetters.id, id));
  if (existing.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
  }

  await db.delete(coverLetters).where(eq(coverLetters.id, id));
  return { success: true, id };
};
