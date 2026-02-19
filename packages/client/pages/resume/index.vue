<script setup lang="ts">
import { formDataToResumeData, resumeDataToFormData, type ResumeFormData } from "@navi/shared";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const {
  resumes,
  currentResume,
  loading,
  fetchResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  exportResume,
  aiEnhance,
  aiScore,
} = useResume();
const router = useRouter();
const route = useRoute();
const { $toast } = useNuxtApp();

const showCreateModal = ref(false);
const newResumeName = ref("");
const newResumeTemplate = ref("modern");
const createDialogRef = ref<HTMLDialogElement | null>(null);
const selectedResumeId = ref<string | null>(null);
const activeTab = ref("personal");
const creating = ref(false);
const enhancing = ref(false);
const scoring = ref(false);
const scoreResult = ref<Record<string, unknown> | null>(null);

interface ResumeExperience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface ResumeEducation {
  degree: string;
  school: string;
  location: string;
  graduationDate: string;
  gpa: string;
}

interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  url: string;
}

const formData = reactive<ResumeFormData>({
  name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  linkedIn: "",
  portfolio: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  gaming: {
    roles: [],
    genres: [],
    achievements: [],
  },
});

onMounted(async () => {
  await fetchResumes();
  const id = route.query.id;
  if (typeof id === "string" && id.trim()) {
    selectedResumeId.value = id.trim();
  }
});

watch(selectedResumeId, async (id) => {
  if (id) {
    const resume = await getResume(id);
    if (resume) {
      const form = resumeDataToFormData(resume);
      Object.assign(formData, form);
    }
  }
});

watch(showCreateModal, (isOpen) => {
  const dialog = createDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

async function handleCreate() {
  if (!newResumeName.value.trim()) return;

  if (newResumeName.value.trim().length < 2) {
    $toast.error("Resume name must be at least 2 characters");
    return;
  }

  creating.value = true;
  try {
    const resume = await createResume({
      name: newResumeName.value,
      template: newResumeTemplate.value,
      personalInfo: {},
      experience: [],
      education: [],
      skills: {},
      projects: [],
      gamingExperience: {},
    });
    showCreateModal.value = false;
    newResumeName.value = "";
    selectedResumeId.value = resume.id;
    $toast.success("Resume created");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to create resume"));
  } finally {
    creating.value = false;
  }
}

async function handleSave() {
  if (!selectedResumeId.value) return;

  try {
    const updates = formDataToResumeData(formData);
    await updateResume(selectedResumeId.value, updates);
    $toast.success("Resume saved");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to save resume"));
  }
}

async function handleDelete(id: string) {
  if (confirm("Are you sure you want to delete this resume?")) {
    try {
      await deleteResume(id);
      if (selectedResumeId.value === id) {
        selectedResumeId.value = null;
      }
      $toast.success("Resume deleted");
    } catch (error: unknown) {
      $toast.error(getErrorMessage(error, "Failed to delete resume"));
    }
  }
}

async function handleExport() {
  if (!selectedResumeId.value) return;
  try {
    await exportResume(selectedResumeId.value);
    $toast.success("Resume exported");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to export resume"));
  }
}

async function handleAIEnhance() {
  if (!selectedResumeId.value) return;

  enhancing.value = true;
  try {
    const enhanced = await aiEnhance(selectedResumeId.value);
    if (enhanced?.resume) {
      const form = resumeDataToFormData(enhanced.resume);
      Object.assign(formData, form);
      $toast.success("Resume enhanced with AI");
    } else if (enhanced) {
      $toast.success("AI suggestions ready");
    }
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to enhance resume"));
  } finally {
    enhancing.value = false;
  }
}

async function handleAIScore() {
  if (!selectedResumeId.value) return;

  scoring.value = true;
  try {
    scoreResult.value = await aiScore(selectedResumeId.value, "");
    $toast.success("Resume scored");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to score resume"));
  } finally {
    scoring.value = false;
  }
}

function addExperience() {
  formData.experience.push({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
}

function removeExperience(index: number) {
  formData.experience.splice(index, 1);
}

function addEducation() {
  formData.education.push({
    degree: "",
    school: "",
    location: "",
    graduationDate: "",
    gpa: "",
  });
}

function removeEducation(index: number) {
  formData.education.splice(index, 1);
}

function addProject() {
  formData.projects.push({
    name: "",
    description: "",
    technologies: [] as string[],
    url: "",
  });
}

function removeProject(index: number) {
  formData.projects.splice(index, 1);
}

const newSkill = ref("");

function addSkill() {
  if (newSkill.value.trim()) {
    formData.skills.push(newSkill.value.trim());
    newSkill.value = "";
  }
}

function removeSkill(index: number) {
  formData.skills.splice(index, 1);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Resume Builder</h1>
      <button
        class="btn btn-primary btn-sm"
        @click="showCreateModal = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Resume
      </button>
      <NuxtLink to="/resume/build" class="btn btn-outline btn-sm">
        Build CV (Guided)
      </NuxtLink>
    </div>

    <LoadingSkeleton v-if="loading && !resumes.length" :lines="6" />

    <div v-else-if="!selectedResumeId" class="space-y-6">
      <div v-if="resumes.length === 0" class="alert">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>No resumes yet. Create your first resume to get started.</span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="resume in resumes"
          :key="resume.id"
          class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
          @click="selectedResumeId = resume.id"
        >
          <div class="card-body">
            <h3 class="card-title">{{ resume.name }}</h3>
            <div class="flex gap-2 mt-2">
              <span class="badge badge-sm">{{ resume.template }}</span>
              <span v-if="resume.isDefault" class="badge badge-primary badge-sm">Default</span>
            </div>
            <div class="card-actions justify-end mt-4">
              <button
                class="btn btn-sm btn-outline"
                @click.stop="selectedResumeId = resume.id"
              >
                Edit
              </button>
              <button
                class="btn btn-sm btn-error btn-outline"
                @click.stop="handleDelete(resume.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resume Editor -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <button
          class="btn btn-ghost btn-sm"
          @click="selectedResumeId = null"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Resumes
        </button>

        <div class="flex gap-2">
          <button
            class="btn btn-sm btn-outline"
            :disabled="enhancing"
            @click="handleAIEnhance"
          >
            <span v-if="enhancing" class="loading loading-spinner loading-xs"></span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Enhance
          </button>
          <button
            class="btn btn-sm btn-outline"
            :disabled="scoring"
            @click="handleAIScore"
          >
            <span v-if="scoring" class="loading loading-spinner loading-xs"></span>
            AI Score
          </button>
          <button class="btn btn-sm btn-outline" @click="handleExport">
            Export PDF
          </button>
          <button class="btn btn-sm btn-primary" @click="handleSave">
            Save
          </button>
        </div>
      </div>

      <div class="tabs tabs-boxed">
        <button class="tab" :class="{ 'tab-active': activeTab === 'personal' }" @click="activeTab = 'personal'">Personal Info</button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'experience' }" @click="activeTab = 'experience'">Experience</button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'education' }" @click="activeTab = 'education'">Education</button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'skills' }" @click="activeTab = 'skills'">Skills</button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'projects' }" @click="activeTab = 'projects'">Projects</button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'gaming' }" @click="activeTab = 'gaming'">Gaming Experience</button>
      </div>

      <!-- Personal Info Tab -->
      <div v-if="activeTab === 'personal'" class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Full Name</legend>
              <input v-model="formData.name" type="text" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Email</legend>
              <input v-model="formData.email" type="email" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Phone</legend>
              <input v-model="formData.phone" type="tel" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Location</legend>
              <input v-model="formData.location" type="text" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">LinkedIn</legend>
              <input v-model="formData.linkedIn" type="url" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Portfolio</legend>
              <input v-model="formData.portfolio" type="url" class="input w-full" />
            </fieldset>
          </div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Professional Summary</legend>
            <textarea v-model="formData.summary" class="textarea w-full" rows="4"></textarea>
          </fieldset>
        </div>
      </div>

      <!-- Experience Tab -->
      <div v-if="activeTab === 'experience'" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Work Experience</h2>
            <button class="btn btn-sm btn-primary" @click="addExperience">
              Add Experience
            </button>
          </div>
          <div class="space-y-6">
            <div v-for="(exp, idx) in formData.experience" :key="idx" class="card bg-base-100">
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">Experience {{ idx + 1 }}</h3>
                  <button class="btn btn-error btn-xs" @click="removeExperience(idx)">
                    Remove
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Job Title</legend>
                    <input v-model="exp.title" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Company</legend>
                    <input v-model="exp.company" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Location</legend>
                    <input v-model="exp.location" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <div class="flex gap-2">
                    <fieldset class="fieldset flex-1">
                      <legend class="fieldset-legend">Start Date</legend>
                      <input v-model="exp.startDate" type="month" class="input w-full input-sm" />
                    </fieldset>
                    <fieldset class="fieldset flex-1">
                      <legend class="fieldset-legend">End Date</legend>
                      <input v-model="exp.endDate" type="month" class="input w-full input-sm" :disabled="exp.current" />
                    </fieldset>
                  </div>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-2">
                    <input v-model="exp.current" type="checkbox" class="checkbox checkbox-sm" />
                    <span class="label-text">Current Position</span>
                  </label>
                </div>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Description</legend>
                  <textarea v-model="exp.description" class="textarea w-full" rows="3"></textarea>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Education Tab -->
      <div v-if="activeTab === 'education'" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Education</h2>
            <button class="btn btn-sm btn-primary" @click="addEducation">
              Add Education
            </button>
          </div>
          <div class="space-y-6">
            <div v-for="(edu, idx) in formData.education" :key="idx" class="card bg-base-100">
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">Education {{ idx + 1 }}</h3>
                  <button class="btn btn-error btn-xs" @click="removeEducation(idx)">
                    Remove
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Degree</legend>
                    <input v-model="edu.degree" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">School</legend>
                    <input v-model="edu.school" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Location</legend>
                    <input v-model="edu.location" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Graduation Date</legend>
                    <input v-model="edu.graduationDate" type="month" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">GPA (Optional)</legend>
                    <input v-model="edu.gpa" type="text" class="input w-full input-sm" />
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills Tab -->
      <div v-if="activeTab === 'skills'" class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Skills</h2>
          <div class="flex gap-2 mb-4">
            <input
              v-model="newSkill"
              type="text"
              placeholder="Add a skill"
              class="input input-sm flex-1"
              @keyup.enter="addSkill"
            />
            <button class="btn btn-sm btn-primary" @click="addSkill">
              Add
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(skill, idx) in formData.skills"
              :key="idx"
              class="badge badge-lg gap-2"
            >
              {{ skill }}
              <button class="btn btn-ghost btn-xs btn-circle" @click="removeSkill(idx)">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Tab -->
      <div v-if="activeTab === 'projects'" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Projects</h2>
            <button class="btn btn-sm btn-primary" @click="addProject">
              Add Project
            </button>
          </div>
          <div class="space-y-6">
            <div v-for="(project, idx) in formData.projects" :key="idx" class="card bg-base-100">
              <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">Project {{ idx + 1 }}</h3>
                  <button class="btn btn-error btn-xs" @click="removeProject(idx)">
                    Remove
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Project Name</legend>
                    <input v-model="project.name" type="text" class="input w-full input-sm" />
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">URL (Optional)</legend>
                    <input v-model="project.url" type="url" class="input w-full input-sm" />
                  </fieldset>
                </div>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Description</legend>
                  <textarea v-model="project.description" class="textarea w-full" rows="3"></textarea>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gaming Experience Tab -->
      <div v-if="activeTab === 'gaming'" class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Gaming Experience</h2>
          <p class="text-sm text-base-content/70 mb-4">
            Highlight your gaming experience and achievements to show your passion and understanding of the industry.
          </p>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Gaming Roles (comma-separated)</legend>
            <input
              v-model="formData.gaming.roles"
              type="text"
              placeholder="e.g. Raid Leader, Guild Officer, Tournament Organizer"
              class="input w-full"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Favorite Genres (comma-separated)</legend>
            <input
              v-model="formData.gaming.genres"
              type="text"
              placeholder="e.g. RPG, Strategy, FPS"
              class="input w-full"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Gaming Achievements (comma-separated)</legend>
            <textarea
              v-model="formData.gaming.achievements"
              class="textarea w-full"
              rows="4"
              placeholder="e.g. Ranked top 100 in Overwatch competitive, Led 40-person raid guild, Organized local esports tournament"
            ></textarea>
          </fieldset>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <dialog ref="createDialogRef" class="modal" @close="showCreateModal = false">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Create New Resume</h3>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Resume Name</legend>
          <input
            v-model="newResumeName"
            type="text"
            placeholder="e.g. Game Designer Resume"
            class="input w-full"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Template</legend>
          <select v-model="newResumeTemplate" class="select w-full">
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="creative">Creative</option>
            <option value="minimal">Minimal</option>
          </select>
        </fieldset>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="showCreateModal = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="creating || !newResumeName.trim()"
            @click="handleCreate"
          >
            <span v-if="creating" class="loading loading-spinner loading-xs"></span>
            Create
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
