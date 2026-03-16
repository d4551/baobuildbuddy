# Job Board Service Layer

Job aggregation for the video game industry, built with Bun, Elysia, and Drizzle ORM.

For the full validation sequence, see [README.md > Validation & Quality Gates](../../../../../README.md#validation--quality-gates).

---

## Architecture

### Providers (`providers/`)

Providers fetch job listings from Applicant Tracking Systems and job boards.

**ATS-native:**
- Greenhouse
- Lever

**Gaming job boards:**
- Hitmarker (API-native + RPA-backed)
- GrackleHQ (RPA)
- Work With Indies (RPA)
- RemoteGameJobs (RPA)
- GamesJobsDirect (RPA)
- PocketGamer.biz (RPA)

**Company board adapters** (via `settings.automationSettings.jobProviders.companyBoards`):
- SmartRecruiters (e.g. CD Projekt Red)
- Workday (e.g. Cloud Imperium Games, Activision/King, Netflix Games, Lightspeed Studios)
- Ashby (e.g. Second Dinner, Sierra Studio)

**Provider registry (`provider-registry.ts`):**
- Registers/unregisters providers at runtime
- Filters disabled providers
- Applies per-provider rate limiting
- Runs fetches concurrently with `Promise.allSettled`
- Returns partial results when some providers fail
- Deduplicates by `contentHash` (fallback: normalized `title::company`)

**Provider interface:**
```typescript
interface JobProvider {
  name: string
  type?: string
  enabled?: boolean
  fetchJobs(filters?: JobFilters): Promise<RawJob[]>
}
```

### Deduplication (`deduplication.ts`)

Content-based duplicate detection using SHA-256 hashing (via `new Bun.CryptoHasher("sha256")`).

| Function              | Purpose                                     |
|-----------------------|---------------------------------------------|
| `generateContentHash` | SHA-256 hash from title + company + location |
| `deduplicateJobs`     | Remove duplicates, keep first occurrence     |
| `findDuplicates`      | Identify all duplicate sets                  |
| `mergeJobs`           | Combine duplicate postings with metadata     |

### Matching (`matching-service.ts`)

Calculates compatibility scores between user profiles and job listings.

**Score breakdown (0-100):**

| Factor      | Weight | What it measures                          |
|-------------|--------|-------------------------------------------|
| Skills      | 25%    | Overlap between user skills and job reqs  |
| Experience  | 20%    | Experience level alignment                |
| Location    | 15%    | Location/remote preferences               |
| Salary      | 15%    | Salary expectation overlap                |
| Technology  | 15%    | Tech stack match                          |
| Culture     | 10%    | Studio type, genre, platform preferences  |

**Output shape:**
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
  strengths: string[]
  improvements: string[]
  missingSkills: string[]
}
```

### Aggregator (`job-aggregator.ts`)

Main orchestration: fetches from all providers, deduplicates, enriches with gaming-specific metadata, caches to SQLite, and supports full-text search with advanced filtering.

```typescript
class JobAggregator {
  refreshJobs(): Promise<{ total: number; new: number; updated: number }>
  searchJobs(filters: JobFilters): Promise<JobSearchResult>
  getJobById(id: string): Promise<Job | null>
  saveJob(jobId: string): Promise<void>
  unsaveJob(jobId: string): Promise<void>
  getSavedJobs(): Promise<Job[]>
  applyToJob(jobId: string, notes?: string): Promise<string>
  getApplications(): Promise<Array<Application & { job: Job }>>
  updateApplicationStatus(id: string, status: string, note?: string): Promise<void>
  needsRefresh(): Promise<boolean>
  getStats(): Promise<Statistics>
}
```

---

## Filtering

```typescript
interface JobFilters {
  query?: string                      // Full-text search
  company?: string
  location?: string
  remote?: boolean
  hybrid?: boolean
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: JobExperienceLevel // entry, junior, mid, senior, principal, director
  jobType?: JobType                   // full-time, part-time, contract, internship, freelance
  technologies?: string[]
  studioTypes?: StudioType[]          // AAA, Indie, Mobile, VR/AR, Platform, Esports
  gameGenres?: GameGenre[]
  platforms?: Platform[]
  postedWithin?: number               // Days since posted
  featured?: boolean
  minMatchScore?: number              // 0-100
  limit?: number
  page?: number
}
```

---

## Data enrichment

The aggregator automatically enriches raw job data with:

- **Remote/hybrid detection** from location strings
- **Experience level** from title (Entry, Junior, Mid, Senior, Principal, Director)
- **Job type** detection (Full-time, Contract, Internship, Freelance)
- **Studio type** categorization (AAA, Indie, Mobile, VR/AR, Platform)
- **Technologies** extracted from descriptions (Unity, Unreal, C++, etc.)
- **Requirements** parsed from descriptions
- **Genres** detected (RPG, FPS, MOBA, etc.)
- **Platforms** identified (PC, Console, Mobile, VR, etc.)
- **Tags** generated for search

---

## Usage examples

### Refresh jobs
```typescript
const result = await jobAggregator.refreshJobs()
appLogger.info("jobs-import-summary", { added: result.new, updated: result.updated })
```

### Search jobs
```typescript
const results = await jobAggregator.searchJobs({
  query: "Unity Developer",
  remote: true,
  experienceLevel: "mid",
  technologies: ["Unity", "C#"],
  limit: 20,
  page: 1
})
```

### Calculate match scores
```typescript
const matchScore = calculateMatchScore(userProfile, job)
appLogger.info("jobs-match-overall", { score: matchScore.overall })
```

### Track applications
```typescript
const applicationId = await jobAggregator.applyToJob("job-id", "Applied via company website")
await jobAggregator.updateApplicationStatus(applicationId, "interviewing", "Phone screen scheduled")
```

---

## Database

Jobs are cached in SQLite using Drizzle ORM.

**Tables:** `jobs`, `savedJobs`, `applications`

**Indexes:** content hash (unique, for dedup), source, posted date, job ID references.

---

## Configuration

**Cache expiry:** `JOB_AGGREGATOR_CACHE_EXPIRY_MS` from `@bao/shared`.

**Provider settings:** Loaded from `settings.automationSettings.jobProviders` via `providers/provider-settings.ts`. If missing or invalid, initialization fails with a configuration error. Update via `PUT /api/settings`.

### Adding a custom provider

```typescript
class CustomProvider implements JobProvider {
  name = "Custom"
  async fetchJobs(query?: string): Promise<RawJob[]> {
    return []
  }
}
this.providers.push(new CustomProvider())
```

---

## Gaming industry specifics

### Studio types
AAA (EA, Activision, Ubisoft), Indie, Mobile (Supercell, King), VR/AR, Platform (Unity, Valve), Esports

### Technologies detected
Engines: Unity, Unreal, Godot, CryEngine | Languages: C++, C#, Python, Lua | Graphics: DirectX, OpenGL, Vulkan, Metal | Tools: Blender, Maya, Substance Painter, ZBrush | VCS: Git, Perforce

### Genres
RPG, FPS, MMORPG, MOBA, Battle Royale, Strategy, Simulation, Sports, Racing, Horror, Platformer, Puzzle, and more

### Platforms
PC, Console (PlayStation, Xbox, Switch), Mobile, VR, AR, Web, Steam

---

## Performance

- **Parallel fetching** with `Promise.allSettled`
- **Pagination** limited to 5 pages per provider
- **Database indexes** for optimized queries
- **SHA-256 hashing** using Bun native crypto
- **Batch scoring** for match calculations

---

## Best practices

1. Run `refreshJobs()` on a schedule (e.g. every 6 hours)
2. Providers fail gracefully -- partial results are returned
3. Use per-provider rate limits and request budgets
4. Always deduplicate when combining sources
5. Score matches in batches for performance
6. Rely on database cache to reduce API calls
