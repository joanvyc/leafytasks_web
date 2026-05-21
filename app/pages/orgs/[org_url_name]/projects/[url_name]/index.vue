<script setup lang="ts">
import type { ApiDateTime, Project, ProjectStatus, StatusUpdate } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string
const url_name = route.params.url_name as string

const { data: projects, error: projectsError } = await useApiFetch<Project[]>(
  `/v1/orgs/${org_url_name}/projects`,
  { method: 'GET', default: () => [] }
)
const project = computed(() => projects.value?.find(p => p.url_name === url_name) ?? null)
if (projectsError.value || !project.value) {
  throw createError({
    statusCode: projectsError.value?.statusCode ?? 404,
    statusMessage: projectsError.value?.statusMessage ?? 'Project not found',
    fatal: true
  })
}

const recursive = ref(false)
const updates = ref<StatusUpdate[]>([
  {
    status: 'active',
    description: 'Project kicked off and initial scope agreed.',
    author: 'Alice Example',
    created_at: '2026-05-01'
  },
  {
    status: 'on-hold',
    description: 'Waiting on partner sign-off before continuing.',
    author: 'Bob Example',
    created_at: '2026-05-10'
  }
])

type BadgeColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'

const status_config: Record<ProjectStatus, { color: BadgeColor, label: string }> = {
  'active': { color: 'success', label: 'Active' },
  'on-hold': { color: 'warning', label: 'On Hold' },
  'completed': { color: 'neutral', label: 'Completed' },
  'archived': { color: 'neutral', label: 'Archived' }
}

function formatDate(value: ApiDateTime | null | undefined): string {
  if (!value) return ''
  const [year, ordinal, hour, minute, second] = value
  return new Date(Date.UTC(year, 0, ordinal, hour, minute, second))
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

const next_update_text = ref('')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 flex justify-between items-center">
        <ULink
          :to="`/orgs/${org_url_name}`"
          class="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← {{ org_url_name }}
        </ULink>
        <UBadge
          color="primary"
          variant="soft"
          icon="lucide:folder"
        >
          Project
        </UBadge>
      </div>
    </div>

    <h1
      v-if="project"
      class="text-3xl font-bold"
    >
      {{ project.title }}
    </h1>

    <div
      v-if="project"
      class="grid grid-cols-3 gap-4 items-start"
    >
      <!-- Main content -->
      <div class="col-span-2 flex flex-col gap-4">
        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Description
            </h2>
          </template>
          <p class="whitespace-pre-line text-sm">
            {{ project.description }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Tasks
            </h2>
          </template>
          <LeafyTasksChildTasks
            :org-url-name="org_url_name"
            :project-url-name="url_name"
          />
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Activity
            </h2>
          </template>
          <UTextarea
            v-model="next_update_text"
            class="w-full mb-2"
            placeholder="Add a project update..."
          />
          <div class="flex justify-end mb-6">
            <UButton>Submit</UButton>
          </div>
          <div class="flex justify-end mb-2">
            <USwitch
              v-model="recursive"
              label="Include subtasks"
            />
          </div>
          <article
            v-for="(update, i) in updates || []"
            :key="i"
            class="mt-4"
          >
            <UUser
              class="mb-2"
              :name="update.author"
              :avatar="{
                src: 'https://gitlab.pm.bsc.es/uploads/-/system/user/avatar/216/avatar.png',
                loading: 'lazy'
              }"
            />
            <UCard>
              <template #header>
                <UBadge
                  :color="status_config[update.status as ProjectStatus].color"
                  variant="soft"
                >
                  {{ status_config[update.status as ProjectStatus].label }}
                </UBadge>
              </template>
              <p class="text-sm">
                {{ update.description }}
              </p>
            </UCard>
          </article>
        </UCard>
      </div>

      <!-- Sidebar -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Project Info
          </h2>
        </template>
        <div class="flex flex-col gap-3 text-sm">
          <div>
            <p class="text-neutral-500 mb-1">
              End date
            </p>
            <p>{{ project.end_date ? formatDate(project.end_date) : '—' }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Created
            </p>
            <p>{{ formatDate(project.created_at) }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Updated
            </p>
            <p>{{ formatDate(project.updated_at) }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
