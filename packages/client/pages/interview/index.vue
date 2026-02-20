<script setup lang="ts">
import type { VoiceSettings } from "@bao/shared";
import { getErrorMessage } from "~/utils/errors";

const { sessions, stats, loading, startSession, fetchSessions, fetchStats } = useInterview();
const { studios, searchStudios } = useStudio();
const tts = useTTS();
const router = useRouter();
const { $toast } = useNuxtApp();

const showConfigModal = ref(false);
const starting = ref(false);
const configDialogRef = ref<HTMLDialogElement | null>(null);

const sessionConfig = reactive({
  studioId: "",
  role: "game-designer",
  experienceLevel: "mid",
  questionCount: 5,
  enableVoiceMode: false,
  voiceSettings: {
    voiceId: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    language: "en-US",
  } as VoiceSettings,
});

onMounted(() => {
  fetchSessions();
  fetchStats();
  searchStudios();
});

watch(showConfigModal, (isOpen) => {
  const dialog = configDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

async function handleStartInterview() {
  if (!sessionConfig.studioId) return;

  starting.value = true;
  try {
    const session = await startSession(sessionConfig.studioId, {
      role: sessionConfig.role,
      experienceLevel: sessionConfig.experienceLevel,
      questionCount: sessionConfig.questionCount,
      enableVoiceMode: sessionConfig.enableVoiceMode,
      voiceSettings: sessionConfig.enableVoiceMode ? sessionConfig.voiceSettings : undefined,
    });
    if (session?.id) {
      $toast.success("Interview session started");
      router.push(`/interview/session?id=${session.id}`);
    }
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to start interview session"));
  } finally {
    starting.value = false;
  }
}

function viewSession(id: string) {
  router.push(`/interview/history?session=${id}`);
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Interview Prep Hub</h1>

    <LoadingSkeleton v-if="loading && !stats" :lines="6" />

    <div v-else class="space-y-6">
      <!-- Stats Overview -->
      <div v-if="stats" class="stats stats-vertical lg:stats-horizontal w-full bg-base-200">
        <div class="stat">
          <div class="stat-title">Total Sessions</div>
          <div class="stat-value text-primary">{{ stats.totalSessions || 0 }}</div>
          <div class="stat-desc">Practice interviews completed</div>
        </div>

        <div class="stat">
          <div class="stat-title">Average Score</div>
          <div class="stat-value text-secondary">{{ stats.averageScore || 0 }}%</div>
          <div class="stat-desc">Overall performance</div>
        </div>

        <div class="stat">
          <div class="stat-title">Improvement</div>
          <div class="stat-value" :class="stats.improvementTrend >= 0 ? 'text-success' : 'text-error'">
            {{ stats.improvementTrend >= 0 ? '+' : '' }}{{ stats.improvementTrend || 0 }}%
          </div>
          <div class="stat-desc">{{ stats.improvementTrend >= 0 ? 'Getting better!' : 'Keep practicing' }}</div>
        </div>
      </div>

      <!-- Start New Interview -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Start New Interview</h2>
          <p class="text-base-content/70">
            Practice studio-specific interviews with AI-powered feedback tailored to game industry roles.
          </p>

          <div class="card-actions mt-4">
            <button
              class="btn btn-primary"
              @click="showConfigModal = true"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Interview Practice
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Sessions -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Recent Sessions</h2>
            <NuxtLink to="/interview/history" class="btn btn-ghost btn-sm">
              View All
            </NuxtLink>
          </div>

          <div v-if="sessions.length === 0" class="alert">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No interview sessions yet. Start your first practice session to begin.</span>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Studio</th>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="session in sessions.slice(0, 5)"
                  :key="session.id"
                  class="hover cursor-pointer"
                  @click="viewSession(session.id)"
                >
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
                  <td>{{ new Date(session.createdAt).toLocaleDateString() }}</td>
                  <td>{{ session.duration || 'N/A' }}</td>
                  <td>
                    <button class="btn btn-ghost btn-xs" @click.stop="viewSession(session.id)">
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

    <!-- Configuration Modal -->
    <dialog ref="configDialogRef" class="modal" @close="showConfigModal = false">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Configure Interview</h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Studio</legend>
            <select v-model="sessionConfig.studioId" class="select w-full" aria-label="Studio Id">
              <option value="">Select a studio</option>
              <option v-for="studio in studios" :key="studio.id" :value="studio.id">
                {{ studio.name }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Role</legend>
            <select v-model="sessionConfig.role" class="select w-full" aria-label="Role">
              <option value="game-designer">Game Designer</option>
              <option value="programmer">Programmer</option>
              <option value="artist">Artist</option>
              <option value="producer">Producer</option>
              <option value="qa">QA Tester</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Experience Level</legend>
            <select v-model="sessionConfig.experienceLevel" class="select w-full" aria-label="Experience Level">
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Number of Questions</legend>
            <select v-model="sessionConfig.questionCount" class="select w-full" aria-label="Question Count">
              <option :value="3">3 Questions (Quick)</option>
              <option :value="5">5 Questions (Standard)</option>
              <option :value="10">10 Questions (Full)</option>
            </select>
          </fieldset>

          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="sessionConfig.enableVoiceMode" type="checkbox" class="toggle toggle-primary" aria-label="Enable Voice Mode"/>
            <span>Enable voice mode (TTS reads questions, STT captures answers)</span>
          </label>

          <template v-if="sessionConfig.enableVoiceMode">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Voice (TTS)</legend>
              <label for="voice-select" class="label">Select voice for reading questions</label>
              <select
                id="voice-select"
                v-model="sessionConfig.voiceSettings.voiceId"
                class="select select-bordered w-full"
                aria-label="Voice Select">
                <option value="">Default</option>
                <option
                  v-for="v in tts.voices"
                  :key="v.voiceURI"
                  :value="v.voiceURI"
                >
                  {{ v.name }} ({{ v.lang }})
                </option>
              </select>
            </fieldset>
          </template>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="showConfigModal = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="starting || !sessionConfig.studioId"
            @click="handleStartInterview"
          >
            <span v-if="starting" class="loading loading-spinner loading-xs"></span>
            Start Interview
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showConfigModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
