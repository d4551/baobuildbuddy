import type { JobFilters, JobProvider, RawJob } from "./provider-interface";

export class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private maxPerMinute = 15) {}

  canMakeRequest(provider: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(provider) || [];
    const recentRequests = requests.filter((t) => now - t < 60000);
    return recentRequests.length < this.maxPerMinute;
  }

  recordRequest(provider: string): void {
    const now = Date.now();
    const requests = this.requests.get(provider) || [];
    const recentRequests = requests.filter((t) => now - t < 60000);
    recentRequests.push(now);
    this.requests.set(provider, recentRequests);
  }
}

export class JobProviderRegistry {
  private providers = new Map<string, JobProvider>();
  private rateLimiter = new SimpleRateLimiter(15);

  register(provider: JobProvider): void {
    this.providers.set(provider.name, provider);
  }

  unregister(name: string): void {
    this.providers.delete(name);
  }

  getProvider(name: string): JobProvider | undefined {
    return this.providers.get(name);
  }

  getEnabledProviders(): JobProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.enabled !== false);
  }

  getProviderStatus(): Array<{ name: string; enabled: boolean; type: string }> {
    return Array.from(this.providers.values()).map((p) => ({
      name: p.name,
      enabled: p.enabled !== false,
      type: p.type || "unknown",
    }));
  }

  async fetchAllJobs(filters: JobFilters): Promise<RawJob[]> {
    const enabledProviders = this.getEnabledProviders();

    const results = await Promise.allSettled(
      enabledProviders.map(async (provider) => {
        if (!this.rateLimiter.canMakeRequest(provider.name)) {
          console.log(`Rate limited: ${provider.name}`);
          return [];
        }
        this.rateLimiter.recordRequest(provider.name);
        try {
          return await provider.fetchJobs(filters);
        } catch (e) {
          console.error(`Provider ${provider.name} failed:`, e instanceof Error ? e.message : e);
          return [];
        }
      }),
    );

    // Flatten results
    const allJobs: RawJob[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allJobs.push(...result.value);
      }
    }

    // Deduplicate by content hash or title+company
    const seen = new Set<string>();
    const uniqueJobs: RawJob[] = [];
    for (const job of allJobs) {
      const key = job.contentHash || `${job.title}::${job.company}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    return uniqueJobs;
  }
}

export const jobProviderRegistry = new JobProviderRegistry();
