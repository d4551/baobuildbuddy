<script setup lang="ts">
import type { InterviewSession } from "@bao/shared";

const route = useRoute();
const { sessions, loading, fetchSessions, getSession } = useInterview();

const selectedSessionId = ref<string | null>(null);
const selectedSession = ref<InterviewSession | null>(null);
const studioFilter = ref("");

onMounted(async () => {
  await fetchSessions();
  if (route.query.session) {
    selectedSessionId.value = route.query.session as string;
    selectedSession.value = await getSession(selectedSessionId.value);
  }
});

const filteredSessions = computed(() => {
  if (!studioFilter.value) return sessions.value;
  return sessions.value.filter((s) => s.studioName === studioFilter.value);
});

const studios = computed(() => {
  return [...new Set(sessions.value.map((s) => s.studioName))].filter(Boolean);
});

async function viewSessionDetail(id: string) {
  selectedSessionId.value = id;
  selectedSession.value = await getSession(id);
}

function closeDetail() {
  selectedSessionId.value = null;
  selectedSession.value = null;
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Interview History</h1>

    <LoadingSkeleton v-if="loading && !sessions.length" :lines="8" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sessions List -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">All Sessions</h2>
              <select v-model="studioFilter" class="select select-sm" aria-label="Studio Filter">
                <option value="">All Studios</option>
                <option v-for="studio in studios" :key="studio" :value="studio">
                  {{ studio }}
                </option>
              </select>
            </div>

            <div v-if="filteredSessions.length === 0" class="alert">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No interview sessions found.</span>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Studio</th>
                    <th>Role</th>
                    <th>Score</th>
                    <th>Duration</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="session in filteredSessions"
                    :key="session.id"
                    class="hover cursor-pointer"
                    :class="{ 'bg-base-300': selectedSessionId === session.id }"
                    @click="viewSessionDetail(session.id)"
                  >
                    <td>{{ new Date(session.createdAt).toLocaleDateString() }}</td>
                    <td>{{ session.studioName }}</td>
                    <td>{{ session.role }}</td>
                    <td>
                      <span class="badge" :class="{
                        'badge-success': session.score >= 80,
                        'badge-warning': session.score >= 60 && session.score < 80,
                        'badge-error': session.score < 60
                      }">
                        {{ session.score }}%
                      </span>
                    </td>
                    <td>{{ session.duration || 'N/A' }}</td>
                    <td>
                      <button class="btn btn-ghost btn-xs" @click.stop="viewSessionDetail(session.id)">
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Session Detail -->
      <div class="lg:col-span-1">
        <div v-if="selectedSession" class="card bg-base-200 sticky top-6">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h3 class="card-title text-lg">Session Details</h3>
              <button class="btn btn-ghost btn-xs btn-circle" @click="closeDetail">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-xs text-base-content/60">Studio</p>
                <p class="font-semibold">{{ selectedSession.studioName }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">Role</p>
                <p class="font-semibold">{{ selectedSession.role }}</p>
              </div>

              <div>
                <p class="text-xs text-base-content/60">Overall Score</p>
                <div class="flex items-center gap-2">
                  <div class="radial-progress" :class="{
                    'text-success': selectedSession.score >= 80,
                    'text-warning': selectedSession.score >= 60 && selectedSession.score < 80,
                    'text-error': selectedSession.score < 60
                  }" :style="`--value:${selectedSession.score}; --size:3rem;`">
                    <span class="text-sm font-bold">{{ selectedSession.score }}%</span>
                  </div>
                </div>
              </div>

              <div>
                <p class="text-xs text-base-content/60 mb-2">Questions</p>
                <div class="space-y-2">
                  <div
                    v-for="(q, idx) in selectedSession.questions"
                    :key="idx"
                    class="collapse collapse-arrow bg-base-100"
                  >
                    <input type="radio" :name="`question-${selectedSession.id}`" aria-label="`question ${selected Session Id}`"/>
                    <div class="collapse-title text-sm font-medium">
                      Q{{ idx + 1 }}: {{ q.score }}%
                    </div>
                    <div class="collapse-content text-xs">
                      <p class="font-semibold mb-1">{{ q.question }}</p>
                      <p class="text-base-content/60 mb-2">{{ q.response }}</p>
                      <p class="text-base-content/80">{{ q.feedback }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="selectedSession.overallFeedback">
                <p class="text-xs text-base-content/60 mb-1">Overall Feedback</p>
                <p class="text-sm">{{ selectedSession.overallFeedback }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card bg-base-200">
          <div class="card-body text-center text-base-content/60">
            <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Select a session to view details</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
