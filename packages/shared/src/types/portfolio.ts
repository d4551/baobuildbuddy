/**
 * Portfolio types for project showcase
 */

export interface PortfolioProject {
  id?: string;
  portfolioId?: string;
  title: string;
  description: string;
  technologies?: string[];
  image?: string;
  liveUrl?: string;
  githubUrl?: string;
  links?: PortfolioLink[];
  media?: PortfolioMedia[];
  tags?: string[];
  featured?: boolean;
  date?: string;
  role?: string;
  responsibilities?: string[];
  outcomes?: string[];
  metrics?: Record<string, number | string>;
  platforms?: string[];
  engines?: string[];
  genres?: string[];
  sortOrder?: number;
}

export interface PortfolioLink {
  label?: string;
  url: string;
  type?: "live" | "source" | "video" | "article" | "store" | "docs" | "other";
}

export interface PortfolioMedia {
  url: string;
  type?: "image" | "video" | "gif";
  caption?: string;
  alt?: string;
}

export interface PortfolioMetadata {
  author?: string;
  title?: string;
  description?: string;
  bio?: string;
  email?: string;
  website?: string;
  social?: Record<string, string>;
}

export interface PortfolioData {
  id?: string;
  projects: PortfolioProject[];
  metadata?: PortfolioMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export type PortfolioExportFormat = "pdf" | "docx" | "zip" | "html" | "json" | "website";

export interface PortfolioExportOptions {
  template?: "modern" | "gaming" | "minimal" | "showcase";
  includeImages?: boolean;
  includeFeaturedOnly?: boolean;
}
