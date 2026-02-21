/**
 * Example usage of the job board service
 * This file demonstrates how to use the job aggregator and matching service
 */

import { jobAggregator } from "./job-aggregator";
import { type UserProfile, calculateMatchScore } from "./matching-service";
import { createServerLogger } from "../../utils/logger";

function isTimelineEvent(value: unknown): value is { date: string; description: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.date === "string" && typeof candidate.description === "string";
}

const jobsExampleLogger = createServerLogger("jobs-example-usage");

// Example 1: Refresh jobs from all providers
async function refreshJobs() {
  jobsExampleLogger.info("Refreshing jobs from all providers...");

  const result = await jobAggregator.refreshJobs();

  jobsExampleLogger.info(`✓ Total jobs fetched: ${result.total}`);
  jobsExampleLogger.info(`✓ New jobs added: ${result.new}`);
  jobsExampleLogger.info(`✓ Jobs updated: ${result.updated}`);

  // Get statistics
  const stats = await jobAggregator.getStats();
  jobsExampleLogger.info("\nJob Statistics:");
  jobsExampleLogger.info(`- Total in cache: ${stats.total}`);
  jobsExampleLogger.info(`- Remote jobs: ${stats.remoteCount}`);
  jobsExampleLogger.info(`- Last updated: ${stats.lastUpdated}`);
  jobsExampleLogger.info("\nBy source:", stats.bySource);
  jobsExampleLogger.info("By experience level:", stats.byExperienceLevel);
}

// Example 2: Search for specific jobs
async function searchUnityJobs() {
  jobsExampleLogger.info("\nSearching for Unity developer positions...");

  const results = await jobAggregator.searchJobs({
    query: "Unity",
    technologies: ["Unity", "C#"],
    remote: true,
    experienceLevel: "mid",
    limit: 10,
  });

  jobsExampleLogger.info(`\nFound ${results.total} jobs:\n`);

  for (const job of results.jobs) {
    jobsExampleLogger.info(`${job.title}`);
    jobsExampleLogger.info(`  Company: ${job.company}`);
    jobsExampleLogger.info(`  Location: ${job.location}`);
    jobsExampleLogger.info(`  Remote: ${job.remote ? "Yes" : "No"}`);
    jobsExampleLogger.info(`  Technologies: ${job.technologies?.join(", ") || "N/A"}`);
    jobsExampleLogger.info(`  URL: ${job.url}`);
    jobsExampleLogger.info();
  }
}

// Example 3: Calculate match scores
async function calculateMatches() {
  jobsExampleLogger.info("\nCalculating match scores...");

  // Define user profile
  const userProfile: UserProfile = {
    skills: ["Game Programming", "C++", "Unity", "Gameplay Programming", "Level Design"],
    technologies: ["Unity", "C#", "Unreal Engine", "Git", "Perforce"],
    experienceLevel: "mid",
    preferredLocations: ["San Francisco", "Los Angeles", "Remote"],
    remotePreference: true,
    salaryExpectation: {
      min: 80000,
      max: 120000,
      currency: "USD",
    },
    preferredStudioTypes: ["AAA", "Indie"],
    preferredGenres: ["RPG", "Action", "Shooter"],
    preferredPlatforms: ["PC", "Console"],
    yearsOfExperience: 4,
  };

  // Get some jobs to match against
  const results = await jobAggregator.searchJobs({
    experienceLevel: "mid",
    limit: 5,
  });

  jobsExampleLogger.info(`\nMatch scores for ${results.jobs.length} jobs:\n`);

  for (const job of results.jobs) {
    const matchScore = calculateMatchScore(userProfile, job);

    jobsExampleLogger.info(`${job.title} at ${job.company}`);
    jobsExampleLogger.info(`  Overall Match: ${matchScore.overall}/100`);
    jobsExampleLogger.info("  Breakdown:");
    jobsExampleLogger.info(`    - Skills: ${matchScore.breakdown.skills}/100`);
    jobsExampleLogger.info(`    - Experience: ${matchScore.breakdown.experience}/100`);
    jobsExampleLogger.info(`    - Location: ${matchScore.breakdown.location}/100`);
    jobsExampleLogger.info(`    - Technology: ${matchScore.breakdown.technology}/100`);
    jobsExampleLogger.info(`    - Salary: ${matchScore.breakdown.salary}/100`);
    jobsExampleLogger.info(`    - Culture: ${matchScore.breakdown.culture}/100`);

    if (matchScore.strengths.length > 0) {
      jobsExampleLogger.info(`  Strengths: ${matchScore.strengths.join(", ")}`);
    }

    if (matchScore.missingSkills.length > 0) {
      jobsExampleLogger.info(`  Missing Skills: ${matchScore.missingSkills.join(", ")}`);
    }

    jobsExampleLogger.info();
  }
}

// Example 4: Save and track applications
async function trackApplications() {
  jobsExampleLogger.info("\nApplication tracking example...");

  // Search for a job
  const results = await jobAggregator.searchJobs({
    query: "Senior Game Programmer",
    limit: 1,
  });

  if (results.jobs.length === 0) {
    jobsExampleLogger.info("No jobs found");
    return;
  }

  const job = results.jobs[0];
  jobsExampleLogger.info(`\nApplying to: ${job.title} at ${job.company}`);

  // Save the job first
  await jobAggregator.saveJob(job.id);
  jobsExampleLogger.info("✓ Job saved for later review");

  // Apply to the job
  const applicationId = await jobAggregator.applyToJob(
    job.id,
    "Applied via company website on 2025-01-15",
  );
  jobsExampleLogger.info(`✓ Application created (ID: ${applicationId})`);

  // Update application status
  await jobAggregator.updateApplicationStatus(
    applicationId,
    "reviewing",
    "Resume was reviewed by HR",
  );
  jobsExampleLogger.info("✓ Application status updated to 'reviewing'");

  // Get all applications
  const applications = await jobAggregator.getApplications();
  jobsExampleLogger.info(`\nYou have ${applications.length} applications:`);

  for (const app of applications) {
    jobsExampleLogger.info(`\n${app.job.title} at ${app.job.company}`);
    jobsExampleLogger.info(`  Status: ${app.status}`);
    jobsExampleLogger.info(`  Applied: ${app.appliedDate}`);
    jobsExampleLogger.info(`  Notes: ${app.notes}`);

    if (app.timeline && app.timeline.length > 0) {
      jobsExampleLogger.info("  Timeline:");
      for (const event of app.timeline) {
        if (isTimelineEvent(event)) {
          jobsExampleLogger.info(`    - ${event.date}: ${event.description}`);
        }
      }
    }
  }

  // Get saved jobs
  const savedJobs = await jobAggregator.getSavedJobs();
  jobsExampleLogger.info(`\nYou have ${savedJobs.length} saved jobs`);
}

// Example 5: Advanced filtering
async function advancedSearch() {
  jobsExampleLogger.info("\nAdvanced search example...");

  const results = await jobAggregator.searchJobs({
    query: "programmer",
    remote: true,
    experienceLevel: "senior",
    studioTypes: ["AAA", "Indie"],
    platforms: ["PC", "Console"],
    technologies: ["Unreal Engine", "C++"],
    postedWithin: 30, // Last 30 days
    limit: 20,
    page: 1,
  });

  jobsExampleLogger.info(`\nFound ${results.total} jobs matching criteria:`);
  jobsExampleLogger.info("- Remote: Yes");
  jobsExampleLogger.info("- Experience: Senior");
  jobsExampleLogger.info("- Studio Types: AAA, Indie");
  jobsExampleLogger.info("- Platforms: PC, Console");
  jobsExampleLogger.info("- Technologies: Unreal Engine, C++");
  jobsExampleLogger.info("- Posted within: 30 days");

  jobsExampleLogger.info(`\nTop ${Math.min(5, results.jobs.length)} results:\n`);

  for (const job of results.jobs.slice(0, 5)) {
    jobsExampleLogger.info(`${job.title} - ${job.company}`);
    jobsExampleLogger.info(`  ${job.location} | ${job.experienceLevel || "N/A"}`);
    jobsExampleLogger.info(`  Studio: ${job.studioType || "Unknown"}`);
    jobsExampleLogger.info(`  Platforms: ${job.platforms?.join(", ") || "N/A"}`);
    jobsExampleLogger.info(`  Posted: ${new Date(job.postedDate).toLocaleDateString()}`);
    jobsExampleLogger.info();
  }
}

// Example 6: Check cache and refresh if needed
async function maintainCache() {
  jobsExampleLogger.info("\nCache maintenance...");

  const needsRefresh = await jobAggregator.needsRefresh();

  if (needsRefresh) {
    jobsExampleLogger.info("Cache is stale, refreshing...");
    await jobAggregator.refreshJobs();
  } else {
    jobsExampleLogger.info("Cache is fresh, no refresh needed");
  }

  const stats = await jobAggregator.getStats();
  jobsExampleLogger.info("\nCurrent cache statistics:");
  jobsExampleLogger.info(`- Total jobs: ${stats.total}`);
  jobsExampleLogger.info(`- Last updated: ${stats.lastUpdated}`);
}

// Main execution function
async function main() {
  await Promise.resolve()
    .then(async () => {
      // Uncomment the examples you want to run

      // await refreshJobs()
      // await searchUnityJobs()
      // await calculateMatches()
      // await trackApplications()
      // await advancedSearch()
      // await maintainCache()

      jobsExampleLogger.info("\n✓ All examples completed successfully");
    })
    .catch((error: unknown) => {
      jobsExampleLogger.error("Error running examples:", error);
      throw error;
    });
}

// Run if executed directly
if (import.meta.main) {
  await main();
}

export {
  refreshJobs,
  searchUnityJobs,
  calculateMatches,
  trackApplications,
  advancedSearch,
  maintainCache,
};
