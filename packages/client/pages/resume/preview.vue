<script setup lang="ts">
import type { ResumeData } from "@navi/shared";

const route = useRoute();
const router = useRouter();
const { getResume, exportResume, loading } = useResume();

const resume = ref<ResumeData | null>(null);
const resumeId = computed(() => route.query.id as string);

const displaySkills = computed(() => {
  if (!resume.value?.skills) return [];
  const { technical = [], soft = [], gaming = [] } = resume.value.skills;
  return [...technical, ...soft, ...gaming];
});

const hasGamingExperience = computed(() => {
  const ge = resume.value?.gamingExperience;
  return ge?.gameEngines || ge?.genres || ge?.shippedTitles;
});

onMounted(async () => {
  if (resumeId.value) {
    resume.value = await getResume(resumeId.value);
  }
});

async function handleExport() {
  if (!resumeId.value) return;
  await exportResume(resumeId.value);
}

function handlePrint() {
  window.print();
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6 no-print">
      <button class="btn btn-ghost btn-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Editor
      </button>

      <div class="flex gap-2">
        <button class="btn btn-sm btn-outline" @click="handlePrint">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
        <button class="btn btn-sm btn-primary" @click="handleExport">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else-if="resume" class="max-w-4xl mx-auto bg-white text-black p-8 shadow-lg print:shadow-none">
      <!-- Header -->
      <div class="text-center mb-8 border-b-2 border-black pb-4">
        <h1 class="text-4xl font-bold mb-2">{{ resume.personalInfo?.name || "Your Name" }}</h1>
        <div class="flex flex-wrap justify-center gap-4 text-sm">
          <span v-if="resume.personalInfo?.email">{{ resume.personalInfo.email }}</span>
          <span v-if="resume.personalInfo?.phone">{{ resume.personalInfo.phone }}</span>
          <span v-if="resume.personalInfo?.location">{{ resume.personalInfo.location }}</span>
        </div>
        <div v-if="resume.personalInfo?.linkedIn || resume.personalInfo?.portfolio" class="flex flex-wrap justify-center gap-4 text-sm mt-2">
          <a v-if="resume.personalInfo?.linkedIn" :href="resume.personalInfo.linkedIn" class="underline">LinkedIn</a>
          <a v-if="resume.personalInfo?.portfolio" :href="resume.personalInfo.portfolio" class="underline">Portfolio</a>
        </div>
      </div>

      <!-- Summary -->
      <div v-if="resume.summary" class="mb-6">
        <h2 class="text-2xl font-bold mb-3 border-b border-gray-300 pb-1">Professional Summary</h2>
        <p class="text-sm leading-relaxed">{{ resume.summary }}</p>
      </div>

      <!-- Experience -->
      <div v-if="resume.experience?.length" class="mb-6">
        <h2 class="text-2xl font-bold mb-3 border-b border-gray-300 pb-1">Work Experience</h2>
        <div
          v-for="(exp, idx) in resume.experience"
          :key="idx"
          class="mb-4"
        >
          <div class="flex justify-between items-start mb-1">
            <div>
              <h3 class="text-lg font-bold">{{ exp.title }}</h3>
              <p class="text-base font-semibold">{{ exp.company }}</p>
            </div>
            <div class="text-right text-sm">
              <p>{{ exp.startDate }} - {{ exp.endDate || "Present" }}</p>
              <p v-if="exp.location">{{ exp.location }}</p>
            </div>
          </div>
          <p v-if="exp.description" class="text-sm whitespace-pre-wrap leading-relaxed">{{ exp.description }}</p>
        </div>
      </div>

      <!-- Education -->
      <div v-if="resume.education?.length" class="mb-6">
        <h2 class="text-2xl font-bold mb-3 border-b border-gray-300 pb-1">Education</h2>
        <div
          v-for="(edu, idx) in resume.education"
          :key="idx"
          class="mb-3"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold">{{ edu.degree }}</h3>
              <p class="text-base">{{ edu.school }}</p>
            </div>
            <div class="text-right text-sm">
              <p>{{ edu.year }}</p>
              <p v-if="edu.gpa">GPA: {{ edu.gpa }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div v-if="displaySkills.length" class="mb-6">
        <h2 class="text-2xl font-bold mb-3 border-b border-gray-300 pb-1">Skills</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(skill, idx) in displaySkills"
            :key="idx"
            class="px-3 py-1 bg-gray-200 text-black text-sm rounded"
          >
            {{ skill }}
          </span>
        </div>
      </div>

      <!-- Projects -->
      <div v-if="resume.projects?.length" class="mb-6">
        <h2 class="text-2xl font-bold mb-3 border-b border-gray-300 pb-1">Projects</h2>
        <div
          v-for="(project, idx) in resume.projects"
          :key="idx"
          class="mb-3"
        >
          <h3 class="text-lg font-bold">{{ project.title }}</h3>
          <p v-if="project.link" class="text-sm underline mb-1">{{ project.link }}</p>
          <p class="text-sm leading-relaxed">{{ project.description }}</p>
        </div>
      </div>

      <!-- Gaming Experience -->
      <div v-if="hasGamingExperience" class="mb-6">
        <h2 class="text-2xl font-bold mb-3 border-b border-gray-300 pb-1">Gaming Experience</h2>
        <div v-if="resume.gamingExperience?.gameEngines" class="mb-2">
          <p class="font-semibold text-sm">Roles:</p>
          <p class="text-sm">{{ resume.gamingExperience.gameEngines }}</p>
        </div>
        <div v-if="resume.gamingExperience?.genres" class="mb-2">
          <p class="font-semibold text-sm">Genres:</p>
          <p class="text-sm">{{ resume.gamingExperience.genres }}</p>
        </div>
        <div v-if="resume.gamingExperience?.shippedTitles">
          <p class="font-semibold text-sm">Achievements:</p>
          <ul class="list-disc list-inside text-sm">
            <li v-for="(achievement, idx) in resume.gamingExperience.shippedTitles.split(';')" :key="idx">
              {{ achievement.trim() }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-error">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Resume not found. Please select a resume to preview.</span>
    </div>
  </div>
</template>

<style>
@media print {
  .no-print {
    display: none !important;
  }

  body {
    background: white;
  }
}
</style>
