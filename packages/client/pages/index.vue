<script setup lang="ts">
import type { DailyChallenge, UserGamificationData } from "@bao/shared";

const { profile, fetchProfile, loading: userLoading } = useUser();
const { jobs } = useJobs();
const { resumes } = useResume();
const { sessions } = useInterview();
const api = useApi();

const gamification = ref<UserGamificationData | null>(null);
const recentActivity = ref<Array<{ type: string; description: string; timestamp: Date }>>([]);
const dailyChallenge = ref<DailyChallenge | null>(null);

if (import.meta.server) {
  useServerSeoMeta({
    title: "BaoBuildBuddy Dashboard",
    description: "Track jobs, resumes, interview practice, and career progress in one dashboard.",
  });
}

await useAsyncData("dashboard-bootstrap", async () => {
  await fetchProfile();
  await fetchGamification();
  await fetchRecentActivity();
  return true;
}, { lazy: false });

async function fetchGamification() {
  try {
    const { data, error } = await api.gamification.progress.get();
    if (error) throw new Error("Failed to fetch gamification");
    gamification.value = data;

    // Fetch daily challenges separately
    const { data: challengeData } = await api.gamification.challenges.get();
    if (challengeData?.challenges) {
      dailyChallenge.value =
        challengeData.challenges.find((c: DailyChallenge) => !c.completed) ||
        challengeData.challenges[0];
    }
  } catch (e) {
    const { $toast } = useNuxtApp();
    $toast.error("Failed to load gamification data");
  }
}

async function fetchRecentActivity() {
  try {
    const { data, error } = await api.gamification.progress.get();
    if (error) throw new Error("Failed to fetch activity");
    const stats = data?.stats as Record<string, unknown>;
    const history = (stats?.actionHistory as Array<Record<string, unknown>>) || [];
    recentActivity.value = history
      .slice(-5)
      .reverse()
      .map((action: Record<string, unknown>) => ({
        type: (action.type as string) || "activity",
        description: (action.reason as string) || (action.type as string) || "Activity",
        timestamp: new Date((action.timestamp as string) || Date.now()),
      }));
  } catch (e) {
    recentActivity.value = [];
  }
}

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const levelProgress = computed(() => {
  if (!gamification.value) return 0;
  return (gamification.value.xp / gamification.value.xpForNextLevel) * 100;
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <LoadingSkeleton v-if="userLoading" :lines="5" />

    <div v-else class="space-y-6">
      <!-- Welcome Card -->
      <div class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div class="card-body">
          <h2 class="card-title text-2xl">
            Welcome{{ profile?.name ? `, ${profile.name}` : "" }}!
          </h2>
          <p class="text-lg opacity-90">Your AI-powered career assistant for the video game industry.</p>
          <div v-if="!profile?.name" class="card-actions mt-2">
            <NuxtLink to="/setup" class="btn btn-primary-content">Complete Setup</NuxtLink>
          </div>
        </div>
      </div>

      <!-- XP Widget -->
      <div v-if="gamification" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">🎮</span>
                <div>
                  <p class="text-sm text-base-content/60">Level {{ gamification.level }}</p>
                  <p class="font-bold">{{ gamification.xp }} / {{ gamification.xpForNextLevel }} XP</p>
                </div>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="levelProgress"
                max="100"
              ></progress>
            </div>

            <div v-if="gamification.currentStreak" class="text-center ml-6">
              <div class="text-3xl">🔥</div>
              <p class="text-2xl font-bold">{{ gamification.currentStreak }}</p>
              <p class="text-xs text-base-content/60">day streak</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Jobs -->
        <div class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors" @click="$router.push('/jobs')">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Job Opportunities</p>
                <p class="text-3xl font-bold">{{ jobs.length || 0 }}</p>
              </div>
              <svg class="w-12 h-12 text-primary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-success">View all jobs</span>
              <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Resumes -->
        <div class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors" @click="$router.push('/resume')">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Resumes</p>
                <p class="text-3xl font-bold">{{ resumes.length || 0 }}</p>
              </div>
              <svg class="w-12 h-12 text-secondary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-secondary">Build resume</span>
              <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Interviews -->
        <div class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors" @click="$router.push('/interview')">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-base-content/60 mb-1">Practice Sessions</p>
                <p class="text-3xl font-bold">{{ sessions.length || 0 }}</p>
              </div>
              <svg class="w-12 h-12 text-accent opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-accent">Practice now</span>
              <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Daily Challenge -->
        <div v-if="dailyChallenge" class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg mb-3">Daily Challenge</h2>
            <div class="card bg-base-100">
              <div class="card-body p-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold">{{ dailyChallenge.title }}</h3>
                  <span class="badge badge-primary">+{{ dailyChallenge.xp }} XP</span>
                </div>
                <div class="flex items-center gap-3">
                  <progress
                    class="progress progress-primary flex-1"
                    :value="dailyChallenge.progress"
                    :max="dailyChallenge.goal"
                  ></progress>
                  <span class="text-sm font-medium">
                    {{ dailyChallenge.progress }} / {{ dailyChallenge.goal }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg mb-3">Recent Activity</h2>
            <div class="space-y-3">
              <div
                v-for="(activity, idx) in recentActivity"
                :key="idx"
                class="flex items-start gap-3"
              >
                <div class="avatar placeholder">
                  <div class="bg-primary text-primary-content rounded-full w-8">
                    <span class="text-xs">
                      {{ activity.type === 'job-application' ? '📝' : activity.type === 'resume' ? '📄' : '🎤' }}
                    </span>
                  </div>
                </div>
                <div class="flex-1">
                  <p class="text-sm">{{ activity.description }}</p>
                  <p class="text-xs text-base-content/60">{{ formatTimeAgo(activity.timestamp) }}</p>
                </div>
              </div>

              <div v-if="recentActivity.length === 0" class="text-center text-base-content/60 py-4">
                <p class="text-sm">No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">Quick Actions</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NuxtLink to="/jobs" class="btn btn-outline">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Jobs
            </NuxtLink>

            <NuxtLink to="/resume" class="btn btn-outline">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Build Resume
            </NuxtLink>

            <NuxtLink to="/interview" class="btn btn-outline">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Practice Interview
            </NuxtLink>

            <NuxtLink to="/ai/chat" class="btn btn-outline">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Chat with BaoBuildBuddy
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
