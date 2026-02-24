import { z } from "zod";

import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "../types/portfolio";

const portfolioLinkSchema = z.object({
  label: z.string().optional(),
  url: z.string().url(),
  type: z.enum(["live", "source", "video", "article", "store", "docs", "other"]),
});

const portfolioMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video", "gif"]),
  caption: z.string().optional(),
  alt: z.string().optional(),
});

/**
 * Canonical schema for a single project in a portfolio.
 */
export const portfolioProjectSchema = z.object({
  id: z.string().optional(),
  portfolioId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  technologies: z.array(z.string()).optional(),
  image: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  links: z.array(portfolioLinkSchema).optional(),
  media: z.array(portfolioMediaSchema).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  date: z.string().optional(),
  role: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  metrics: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  platforms: z.array(z.string()).optional(),
  engines: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * Canonical metadata schema for portfolio contracts.
 */
export const portfolioMetadataSchema = z.object({
  author: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  social: z.record(z.string(), z.string()).optional(),
});

/**
 * Canonical schema for full portfolio contract.
 */
export const portfolioDataSchema = z.object({
  id: z.string().optional(),
  metadata: portfolioMetadataSchema.optional(),
  projects: z.array(portfolioProjectSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const portfolioUpdateSchema = z.object({
  metadata: portfolioMetadataSchema.partial().optional(),
});

export const portfolioReorderSchema = z.object({
  orderedIds: z.array(z.string()),
});

export const portfolioProjectCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  technologies: z.array(z.string()).max(50).optional(),
  image: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(50).optional(),
  featured: z.boolean().optional(),
  role: z.string().optional(),
  platforms: z.array(z.string()).max(20).optional(),
  engines: z.array(z.string()).max(20).optional(),
  sortOrder: z.number().int().optional(),
});

export const portfolioProjectUpdateSchema = portfolioProjectCreateSchema.partial();

export type PortfolioSchema = z.infer<typeof portfolioDataSchema>;

/**
 * Export for typed compatibility from shared schema + local type.
 */
export type PortfolioSchemaInput = z.input<typeof portfolioDataSchema>;

export type PortfolioMetadataSchemaInput = z.input<typeof portfolioMetadataSchema>;

export type PortfolioMetadataSchemaType = PortfolioMetadata;
export type PortfolioProjectSchemaType = PortfolioProject;
export type PortfolioDataSchemaType = PortfolioData;
