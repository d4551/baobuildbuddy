import { generateId } from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { portfolioProjects, portfolios } from "../db/schema/schema-modules";
import type {
  CreatePortfolioProjectPayload,
  PortfolioRecord,
  UpdatePortfolioProjectPayload,
} from "./portfolio-service-contracts";
import {
  createProjectInsert,
  createProjectUpdate,
  metadataToRecord,
  toProject,
} from "./portfolio-service-normalizers";

export const getOrCreateDefaultPortfolioRecord = async (): Promise<PortfolioRecord> => {
  const rows = await db.select().from(portfolios);
  const existingPortfolio = rows[0];
  if (existingPortfolio) {
    return existingPortfolio;
  }

  const now = new Date().toISOString();
  const id = generateId();
  const createdPortfolio: PortfolioRecord = {
    id,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(portfolios).values(createdPortfolio);
  return createdPortfolio;
};

export const getPortfolioRecord = async (portfolioId?: string): Promise<PortfolioRecord | null> => {
  if (portfolioId) {
    const rows = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId));
    return rows[0] ?? null;
  }

  const rows = await db.select().from(portfolios);
  return rows[0] ?? null;
};

export const updatePortfolioMetadata = async (
  portfolioId: string,
  metadata: Record<string, unknown>,
  now: string,
): Promise<void> => {
  await db
    .update(portfolios)
    .set({
      metadata,
      updatedAt: now,
    })
    .where(eq(portfolios.id, portfolioId));
};

export const getProjectsForPortfolio = async (portfolioId: string) => {
  const results = await db
    .select()
    .from(portfolioProjects)
    .where(eq(portfolioProjects.portfolioId, portfolioId))
    .orderBy(portfolioProjects.sortOrder, desc(portfolioProjects.createdAt));

  return results.map((row) => toProject(row));
};

export const getProjectById = async (id: string) => {
  const results = await db.select().from(portfolioProjects).where(eq(portfolioProjects.id, id));
  const project = results[0];
  return project ? toProject(project) : null;
};

export const createProject = async (
  portfolioId: string,
  data: CreatePortfolioProjectPayload,
): Promise<string> => {
  const id = generateId();
  const now = new Date().toISOString();
  const projects = await getProjectsForPortfolio(portfolioId);
  const maxSortOrder = projects.reduce((max, project) => Math.max(max, project.sortOrder || 0), 0);

  await db
    .insert(portfolioProjects)
    .values(
      createProjectInsert({
        id,
        portfolioId,
        data,
        now,
        sortOrder: data.sortOrder ?? maxSortOrder + 1,
      }),
    );

  return id;
};

export const updateProjectById = async (
  id: string,
  data: UpdatePortfolioProjectPayload,
): Promise<boolean> => {
  const existingProject = await getProjectById(id);
  if (!existingProject) {
    return false;
  }

  await db
    .update(portfolioProjects)
    .set(createProjectUpdate(data, new Date().toISOString()))
    .where(eq(portfolioProjects.id, id));

  return true;
};

export const deleteProjectById = async (id: string): Promise<boolean> => {
  const deletedProjects = await db
    .delete(portfolioProjects)
    .where(eq(portfolioProjects.id, id))
    .returning({ id: portfolioProjects.id });
  return deletedProjects.length > 0;
};

export const reorderPortfolioProjects = async (
  portfolioId: string,
  orderedIds: string[],
): Promise<{
  valid: boolean;
}> => {
  const existingProjects = await getProjectsForPortfolio(portfolioId);
  const validIds = existingProjects.map((project) => project.id);
  const hasInvalidIds = orderedIds.some((id) => !validIds.includes(id));
  if (hasInvalidIds) {
    return { valid: false };
  }

  if (orderedIds.length === 0) {
    return { valid: true };
  }

  const orderedUpdateTimestamp = new Date().toISOString();
  const orderedProjectIds = orderedIds.filter((orderedId): orderedId is string => Boolean(orderedId));
  await Promise.all(
    orderedProjectIds.map((orderedId, index) =>
      db
        .update(portfolioProjects)
        .set({ sortOrder: index, updatedAt: orderedUpdateTimestamp })
        .where(eq(portfolioProjects.id, orderedId)),
    ),
  );

  const remainingProjects = existingProjects.filter(
    (project) => !(project.id && orderedIds.includes(project.id)),
  );
  const remainingUpdateTimestamp = new Date().toISOString();
  await Promise.all(
    remainingProjects
      .filter((project): project is typeof project & { id: string } => Boolean(project.id))
      .map((project, index) =>
        db
          .update(portfolioProjects)
          .set({ sortOrder: orderedIds.length + index, updatedAt: remainingUpdateTimestamp })
          .where(eq(portfolioProjects.id, project.id)),
      ),
  );

  return { valid: true };
};

export const serializePortfolioMetadata = metadataToRecord;
