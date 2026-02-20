/**
 * Example usage of the job board service
 * This file demonstrates how to use the job aggregator and matching service
 */

import { jobAggregator } from "./job-aggregator";
import { type UserProfile, calculateMatchScore } from "./matching-service";

function isTimelineEvent(
  value: unknown,
): value is { date: string; description: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.date === "string" && typeof candidate.description === "string";
}

// Example 1: Refresh jobs from all providers
async function refreshJobs() {
  console.log("Refreshing jobs from all providers...");

  const result = await jobAggregator.refreshJobs();

  console.log(`✓ Total jobs fetched: ${result.total}`);
  console.log(`✓ New jobs added: ${result.new}`);
  console.log(`✓ Jobs updated: ${result.updated}`);

  // Get statistics
  const stats = await jobAggregator.getStats();
  console.log("\nJob Statistics:");
  console.log(`- Total in cache: ${stats.total}`);
  console.log(`- Remote jobs: ${stats.remoteCount}`);
  console.log(`- Last updated: ${stats.lastUpdated}`);
  console.log("\nBy source:", stats.bySource);
  console.log("By experience level:", stats.byExperienceLevel);
}

// Example 2: Search for specific jobs
async function searchUnityJobs() {
  console.log("\nSearching for Unity developer positions...");

  const results = await jobAggregator.searchJobs({
    query: "Unity",
    technologies: ["Unity", "C#"],
    remote: true,
    experienceLevel: "mid",
    limit: 10,
  });

  console.log(`\nFound ${results.total} jobs:\n`);

  for (const job of results.jobs) {
    console.log(`${job.title}`);
    console.log(`  Company: ${job.company}`);
    console.log(`  Location: ${job.location}`);
    console.log(`  Remote: ${job.remote ? "Yes" : "No"}`);
    console.log(`  Technologies: ${job.technologies?.join(", ") || "N/A"}`);
    console.log(`  URL: ${job.url}`);
    console.log();
  }
}

// Example 3: Calculate match scores
async function calculateMatches() {
  console.log("\nCalculating match scores...");

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

  console.log(`\nMatch scores for ${results.jobs.length} jobs:\n`);

  for (const job of results.jobs) {
    const matchScore = calculateMatchScore(userProfile, job);

    console.log(`${job.title} at ${job.company}`);
    console.log(`  Overall Match: ${matchScore.overall}/100`);
    console.log("  Breakdown:");
    console.log(`    - Skills: ${matchScore.breakdown.skills}/100`);
    console.log(`    - Experience: ${matchScore.breakdown.experience}/100`);
    console.log(`    - Location: ${matchScore.breakdown.location}/100`);
    console.log(`    - Technology: ${matchScore.breakdown.technology}/100`);
    console.log(`    - Salary: ${matchScore.breakdown.salary}/100`);
    console.log(`    - Culture: ${matchScore.breakdown.culture}/100`);

    if (matchScore.strengths.length > 0) {
      console.log(`  Strengths: ${matchScore.strengths.join(", ")}`);
    }

    if (matchScore.missingSkills.length > 0) {
      console.log(`  Missing Skills: ${matchScore.missingSkills.join(", ")}`);
    }

    console.log();
  }
}

// Example 4: Save and track applications
async function trackApplications() {
  console.log("\nApplication tracking example...");

  // Search for a job
  const results = await jobAggregator.searchJobs({
    query: "Senior Game Programmer",
    limit: 1,
  });

  if (results.jobs.length === 0) {
    console.log("No jobs found");
    return;
  }

  const job = results.jobs[0];
  console.log(`\nApplying to: ${job.title} at ${job.company}`);

  // Save the job first
  await jobAggregator.saveJob(job.id);
  console.log("✓ Job saved for later review");

  // Apply to the job
  const applicationId = await jobAggregator.applyToJob(
    job.id,
    "Applied via company website on 2025-01-15",
  );
  console.log(`✓ Application created (ID: ${applicationId})`);

  // Update application status
  await jobAggregator.updateApplicationStatus(
    applicationId,
    "reviewing",
    "Resume was reviewed by HR",
  );
  console.log("✓ Application status updated to 'reviewing'");

  // Get all applications
  const applications = await jobAggregator.getApplications();
  console.log(`\nYou have ${applications.length} applications:`);

  for (const app of applications) {
    console.log(`\n${app.job.title} at ${app.job.company}`);
    console.log(`  Status: ${app.status}`);
    console.log(`  Applied: ${app.appliedDate}`);
    console.log(`  Notes: ${app.notes}`);

    if (app.timeline && app.timeline.length > 0) {
      console.log("  Timeline:");
      for (const event of app.timeline) {
        if (isTimelineEvent(event)) {
          console.log(`    - ${event.date}: ${event.description}`);
        }
      }
    }
  }

  // Get saved jobs
  const savedJobs = await jobAggregator.getSavedJobs();
  console.log(`\nYou have ${savedJobs.length} saved jobs`);
}

// Example 5: Advanced filtering
async function advancedSearch() {
  console.log("\nAdvanced search example...");

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

  console.log(`\nFound ${results.total} jobs matching criteria:`);
  console.log("- Remote: Yes");
  console.log("- Experience: Senior");
  console.log("- Studio Types: AAA, Indie");
  console.log("- Platforms: PC, Console");
  console.log("- Technologies: Unreal Engine, C++");
  console.log("- Posted within: 30 days");

  console.log(`\nTop ${Math.min(5, results.jobs.length)} results:\n`);

  for (const job of results.jobs.slice(0, 5)) {
    console.log(`${job.title} - ${job.company}`);
    console.log(`  ${job.location} | ${job.experienceLevel || "N/A"}`);
    console.log(`  Studio: ${job.studioType || "Unknown"}`);
    console.log(`  Platforms: ${job.platforms?.join(", ") || "N/A"}`);
    console.log(`  Posted: ${new Date(job.postedDate).toLocaleDateString()}`);
    console.log();
  }
}

// Example 6: Check cache and refresh if needed
async function maintainCache() {
  console.log("\nCache maintenance...");

  const needsRefresh = await jobAggregator.needsRefresh();

  if (needsRefresh) {
    console.log("Cache is stale, refreshing...");
    await jobAggregator.refreshJobs();
  } else {
    console.log("Cache is fresh, no refresh needed");
  }

  const stats = await jobAggregator.getStats();
  console.log("\nCurrent cache statistics:");
  console.log(`- Total jobs: ${stats.total}`);
  console.log(`- Last updated: ${stats.lastUpdated}`);
}

// Main execution function
async function main() {
  try {
    // Uncomment the examples you want to run

    // await refreshJobs()
    // await searchUnityJobs()
    // await calculateMatches()
    // await trackApplications()
    // await advancedSearch()
    // await maintainCache()

    console.log("\n✓ All examples completed successfully");
  } catch (error) {
    console.error("Error running examples:", error);
    throw error;
  }
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
