import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import {
  addPortfolioPageNumbers,
  createPortfolioContext,
} from "./export-service-portfolio-context";
import {
  renderPortfolioCoverPage,
  startPortfolioProjectsSection,
} from "./export-service-portfolio-cover";
import { renderPortfolioProject } from "./export-service-portfolio-projects";

export async function exportPortfolioPdf(
  metadata: PortfolioMetadata,
  projects: PortfolioProject[],
  template?: string | null,
): Promise<Uint8Array> {
  const context = await createPortfolioContext(template);
  renderPortfolioCoverPage(context, metadata);
  startPortfolioProjectsSection(context);

  for (let index = 0; index < projects.length; index += 1) {
    renderPortfolioProject(context, projects[index], index, projects.length);
  }

  addPortfolioPageNumbers(context);
  return context.pdfDoc.save();
}
