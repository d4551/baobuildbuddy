import {
  API_ERROR_COVER_LETTER_NOT_FOUND,
  COVER_LETTER_DEFAULT_TEMPLATE,
  type CoverLetterTemplate,
  generateId,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  isCoverLetterTemplate,
  ROUTE_GAMIFICATION_XP,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { gamificationService } from "../services/gamification-service";
import type { RouteSetState } from "./cover-letter-route-contracts";

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
  gamificationService.trackActionFireAndForget(
    "coverLettersGenerated",
    ROUTE_GAMIFICATION_XP.coverLettersGenerated,
    "cover_letter_created",
  );

  return { coverLetter, statusCode: HTTP_STATUS_CREATED };
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
