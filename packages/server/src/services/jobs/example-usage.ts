/**
 * Example usage of the job board service
 * This file demonstrates how to use the job aggregator and matching service
 */

import { createServerLogger } from "../../utils/logger";
import { coverLetterService } from "../cover-letter-service";

const jobsExampleLogger = createServerLogger("jobs-example-usage");
async function previewCoverLetters() {
  jobsExampleLogger.info("\nCover letter service example...");

  const coverLetters = await coverLetterService.getCoverLetters();
  jobsExampleLogger.info(`✓ Total cover letters: ${coverLetters.length}`);

  for (const coverLetter of coverLetters.slice(0, 3)) {
    jobsExampleLogger.info(`${coverLetter.company} - ${coverLetter.position}`);
  }
}

// Main execution function
async function main(): Promise<void> {
  await previewCoverLetters();

  jobsExampleLogger.info("\n✓ All examples completed successfully");
  return Promise.resolve();
}

// Run if executed directly
if (import.meta.main) {
  await main();
}
