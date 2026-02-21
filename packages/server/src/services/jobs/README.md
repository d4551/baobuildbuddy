# Job Board Service Layer

A comprehensive job aggregation service for the video game industry, built with Bun, Elysia, and Drizzle ORM.

## Architecture

The service is organized into several key modules:

### Providers (`providers/`)

Job providers fetch listings from various Applicant Tracking Systems (ATS) used by gaming studios.

**Available Providers:**

- **ATS-native providers**:
  - **Greenhouse**
  - **Lever**
- **Gaming job boards**:
  - **Hitmarker** (API-native)
  - **GameDev.net** (RPA-backed)
  - **GrackleHQ** (RPA-backed)
  - **Work With Indies** (RPA-backed)
  - **RemoteGameJobs** (RPA-backed)
  - **GamesJobsDirect** (RPA-backed)
  - **PocketGamer.biz** (RPA-backed)
- **Company board adapters** via `settings.automationSettings.jobProviders.companyBoards`:
  - **SmartRecruiters** (e.g. CD Projekt Red)
  - **Workday** (e.g. Cloud Imperium Games, Activision/King, Netflix Games, Lightspeed Studios)
  - **Ashby** (e.g. Second Dinner, Sierra Studio)

**Provider Registry Behavior (`provider-registry.ts`):**

- Registers and unregisters providers at runtime.
- Filters disabled providers from execution.
- Applies a per-provider request limiter before fetch.
- Executes provider fetches concurrently with `Promise.allSettled`.
- Returns partial success when some providers fail.
- Deduplicates by `contentHash` (fallback: normalized `title::company`).

**Provider Interface:**
```typescript
interface JobProvider {
  name: string
  type?: string
  enabled?: boolean
  fetchJobs(filters?: JobFilters): Promise<RawJob[]>
}
```

### Deduplication (`deduplication.ts`)

Handles duplicate detection across multiple job sources using content-based hashing.

**Key Functions:**
- `generateContentHash(job)` - Creates SHA-256 hash from title + company + location
- `deduplicateJobs(jobs)` - Removes duplicates, keeping first occurrence
- `findDuplicates(jobs)` - Identifies all duplicate sets
- `mergeJobs(jobs)` - Combines duplicate postings with metadata

Uses Bun's native crypto: `new Bun.CryptoHasher("sha256")`

### Matching Service (`matching-service.ts`)

Algorithmic job matching that calculates compatibility scores between user profiles and job postings.

**Match Score Breakdown:**
- Skills (25%) - Overlap between user skills and job requirements
- Experience (20%) - Experience level alignment
- Location (15%) - Location/remote preferences
- Salary (15%) - Salary expectation overlap
- Technology (15%) - Technology stack match
- Culture (10%) - Studio type, genre, platform preferences

**Key Functions:**
- `calculateMatchScore(userProfile, job)` - Returns 0-100 score with detailed breakdown
- `calculateMatchScores(userProfile, jobs[])` - Batch scoring
- `sortByMatchScore(jobs)` - Sort jobs by match score

**Match Score Output:**
```typescript
interface MatchScore {
  overall: number              // 0-100
  breakdown: {
    skills: number
    experience: number
    location: number
    salary: number
    culture: number
    technology: number
  }
  strengths: string[]          // What matches well
  improvements: string[]       // Areas to develop
  missingSkills: string[]      // Required skills user lacks
}
```

### Job Aggregator (`job-aggregator.ts`)

Main orchestration service that ties everything together.

**Key Features:**
- Fetches from all providers in parallel
- Deduplicates across sources
- Enriches job data with gaming-specific metadata
- Caches to SQLite via Drizzle ORM
- Full-text search with advanced filtering
- Saved jobs and application tracking

**Core Methods:**

```typescript
class JobAggregator {
  // Refresh jobs from all providers
  refreshJobs(): Promise<{ total: number; new: number; updated: number }>

  // Search with comprehensive filters
  searchJobs(filters: JobFilters): Promise<JobSearchResult>

  // Get single job
  getJobById(id: string): Promise<Job | null>

  // Save/unsave jobs
  saveJob(jobId: string): Promise<void>
  unsaveJob(jobId: string): Promise<void>
  getSavedJobs(): Promise<Job[]>

  // Application tracking
  applyToJob(jobId: string, notes?: string): Promise<string>
  getApplications(): Promise<Array<Application & { job: Job }>>
  updateApplicationStatus(id: string, status: string, note?: string): Promise<void>

  // Cache management
  needsRefresh(): Promise<boolean>
  getStats(): Promise<Statistics>
}
```

## Job Filters

Comprehensive filtering system:

```typescript
interface JobFilters {
  query?: string                      // Full-text search
  company?: string                    // Filter by company
  location?: string                   // Filter by location
  remote?: boolean                    // Remote only
  hybrid?: boolean                    // Hybrid only
  salaryMin?: number                  // Minimum salary
  salaryMax?: number                  // Maximum salary
  experienceLevel?: JobExperienceLevel // entry, junior, mid, senior, principal, director
  jobType?: JobType                   // full-time, part-time, contract, internship, freelance
  technologies?: string[]             // Required technologies
  studioTypes?: StudioType[]          // AAA, Indie, Mobile, VR/AR, Platform, Esports
  gameGenres?: GameGenre[]            // Action, RPG, Strategy, etc.
  platforms?: Platform[]              // PC, Console, Mobile, VR, etc.
  postedWithin?: number               // Days since posted
  featured?: boolean                  // Featured jobs only
  minMatchScore?: number              // Minimum match score (0-100)
  limit?: number                      // Results per page
  page?: number                       // Page number
}
```

## Data Enrichment

The aggregator automatically enriches raw job data with:

- **Remote/Hybrid Detection** - Analyzes location strings
- **Experience Level** - Extracts from title (Entry, Junior, Mid, Senior, Principal, Director)
- **Job Type** - Detects Full-time, Contract, Internship, Freelance
- **Studio Type** - Categorizes companies (AAA, Indie, Mobile, VR/AR, Platform)
- **Technologies** - Extracts tech stack from description (Unity, Unreal, C++, etc.)
- **Requirements** - Parses required skills from description
- **Genres** - Detects game genres (RPG, FPS, MOBA, etc.)
- **Platforms** - Identifies target platforms (PC, Console, Mobile, VR, etc.)
- **Tags** - Generates searchable tags

## Usage Examples

### Basic Job Refresh

```typescript
import { jobAggregator } from "./services/jobs"

// Refresh all jobs from providers
const result = await jobAggregator.refreshJobs()
console.log(`Added ${result.new} new jobs, updated ${result.updated}`)
```

### Search Jobs

```typescript
// Search for remote Unity developer positions
const results = await jobAggregator.searchJobs({
  query: "Unity Developer",
  remote: true,
  experienceLevel: "mid",
  technologies: ["Unity", "C#"],
  platforms: ["PC", "Console"],
  limit: 20,
  page: 1
})

console.log(`Found ${results.total} jobs`)
results.jobs.forEach(job => {
  console.log(`${job.title} at ${job.company}`)
})
```

### Calculate Match Scores

```typescript
import { calculateMatchScore } from "./services/jobs"

const userProfile = {
  skills: ["Game Programming", "C++", "Unity", "Level Design"],
  technologies: ["Unity", "C#", "Unreal Engine"],
  experienceLevel: "mid",
  preferredLocations: ["San Francisco", "Remote"],
  remotePreference: true,
  salaryExpectation: { min: 80000, max: 120000 }
}

const job = await jobAggregator.getJobById("job-id")
const matchScore = calculateMatchScore(userProfile, job)

console.log(`Match: ${matchScore.overall}/100`)
console.log(`Strengths: ${matchScore.strengths.join(", ")}`)
console.log(`Missing Skills: ${matchScore.missingSkills.join(", ")}`)
```

### Application Tracking

```typescript
// Apply to a job
const applicationId = await jobAggregator.applyToJob(
  "job-id",
  "Applied via company website"
)

// Update status
await jobAggregator.updateApplicationStatus(
  applicationId,
  "interviewing",
  "Phone screen scheduled for next week"
)

// Get all applications
const applications = await jobAggregator.getApplications()
applications.forEach(app => {
  console.log(`${app.job.title} - ${app.status}`)
})
```

### Cache Management

```typescript
// Check if cache needs refresh
if (await jobAggregator.needsRefresh()) {
  await jobAggregator.refreshJobs()
}

// Get statistics
const stats = await jobAggregator.getStats()
console.log(`Total jobs: ${stats.total}`)
console.log(`Remote jobs: ${stats.remoteCount}`)
console.log(`By source:`, stats.bySource)
console.log(`Last updated: ${stats.lastUpdated}`)
```

## Database Schema

Jobs are cached in SQLite using Drizzle ORM:

**Tables:**
- `jobs` - Job listings with full metadata
- `savedJobs` - User-saved jobs
- `applications` - Job applications with status tracking

**Indexes:**
- Content hash (unique) - For deduplication
- Source - For provider-based queries
- Posted date - For time-based filtering
- Job ID references - For foreign keys

## Configuration

### Cache Expiry

Jobs are cached for 6 hours by default (`job-aggregator.ts`, `cacheExpiry`):

```typescript
constructor() {
  this.cacheExpiry = 6 * 60 * 60 * 1000 // 6 hours
}
```

### Provider runtime source of truth

Provider runtime settings are loaded from `settings.automationSettings.jobProviders` through `providers/provider-settings.ts`.
If this object is missing or invalid, provider initialization fails with a deterministic configuration error.
Use `PUT /api/settings` to update provider runtime configuration without code changes.

### Adding Custom Providers

```typescript
class CustomProvider implements JobProvider {
  name = "Custom"

  async fetchJobs(query?: string): Promise<RawJob[]> {
    // Implement custom fetching logic
    return []
  }
}

// Add to aggregator
this.providers.push(new CustomProvider())
```

### Configuring Provider Lists

```typescript
// Custom Greenhouse boards
const greenhouse = new GreenhouseProvider([
  "mycompany",
  "otherstudio"
])

// Custom Lever companies
const lever = new LeverProvider([
  "mystudio",
  "anothergame"
])
```

## Gaming Industry Specifics

The service is optimized for video game industry jobs:

### Studio Types
- **AAA** - Major publishers (EA, Activision, Ubisoft)
- **Indie** - Independent studios
- **Mobile** - Mobile-first studios (Supercell, King)
- **VR/AR** - Virtual/Augmented reality
- **Platform** - Engine and platform companies (Unity, Valve)
- **Esports** - Competitive gaming organizations

### Technology Focus
Common gaming technologies automatically detected:
- Engines: Unity, Unreal Engine, Godot, CryEngine
- Languages: C++, C#, Python, Lua
- Graphics: DirectX, OpenGL, Vulkan, Metal
- Tools: Blender, Maya, Substance Painter, ZBrush
- Version Control: Git, Perforce

### Genres
RPG, FPS, MMORPG, MOBA, Battle Royale, Strategy, Simulation, Sports, Racing, Horror, Platformer, Puzzle, and more.

### Platforms
PC, Console (PlayStation, Xbox, Switch), Mobile, VR, AR, Web, Steam

## Best Practices

1. **Refresh Frequency** - Run `refreshJobs()` on a schedule (e.g., every 6 hours) via cron or job queue
2. **Error Handling** - Providers fail gracefully; partial results returned if some providers fail
3. **Rate Limiting** - Use registry/provider limits and request budgets to avoid source blocking
4. **Deduplication** - Always run deduplication when combining multiple sources
5. **Matching** - Calculate match scores in batches for better performance
6. **Caching** - Rely on database cache; avoid excessive API calls

## Performance

- **Parallel Fetching** - All providers fetch simultaneously using `Promise.allSettled`
- **Pagination** - Limited to 5 pages per provider to avoid excessive requests
- **Database Indexes** - Optimized queries with proper indexes
- **Content Hashing** - Fast SHA-256 hashing using Bun native crypto
- **Batch Operations** - Support for batch match scoring

## Error Handling

All provider failures are caught and logged. The aggregator continues with successful providers:

```typescript
const results = await Promise.allSettled(
  this.providers.map(provider => provider.fetchJobs())
)
// Partial results returned even if some providers fail
```

## Future Enhancements

Potential additions:
- Additional ATS adapters (iCIMS, BambooHR)
- Additional gaming boards and regional sources
- AI-powered job description analysis
- Salary data integration
- Company culture scores
- Interview preparation resources
- Application deadline tracking

## License

Part of the BaoBuildBuddy project.
