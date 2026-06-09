<script setup lang="ts">
import type { ApiDateTime, Project, StatusPost, TaskSummary } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string
const url_name = route.params.url_name as string

const { $api } = useNuxtApp()

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

function formatDate(value: ApiDateTime | null | undefined): string {
  if (!value) return ''
  const [year, ordinal, hour, minute, second] = value
  return new Date(Date.UTC(year, 0, ordinal, hour, minute, second))
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

function createdAtMs(value: ApiDateTime): number {
  const [year, ordinal, hour, minute, second] = value
  return Date.UTC(year, 0, ordinal, hour, minute, second)
}

// There is no project-level status endpoint: the project Activity feed is the
// merge of every root task's status posts, sorted by created_at. The "Include
// subtasks" switch drives each task's `subtasks` param.
const recursive = ref(false)
const tasksUrl = `/v1/orgs/${org_url_name}/projects/${url_name}/tasks`

const { data: updates } = await useAsyncData(
  `project-status-${org_url_name}-${url_name}`,
  async () => {
    const tasks = await $api<TaskSummary[]>(tasksUrl) ?? []
    const roots = tasks.filter(t => t.parent_id === null)
    const lists = await Promise.all(roots.map(r =>
      $api<StatusPost[]>(`${tasksUrl}/${r.id}/status`, { query: { subtasks: recursive.value } })
        .catch(() => [] as StatusPost[])
    ))
    return lists.flat().sort((a, b) => createdAtMs(a.created_at) - createdAtMs(b.created_at))
  },
  { watch: [recursive], default: () => [] }
)
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
          <div class="flex justify-end mb-2">
            <USwitch
              v-model="recursive"
              label="Include subtasks"
            />
          </div>
          <p
            v-if="!updates?.length"
            class="text-sm text-neutral-500 text-center py-4"
          >
            No activity yet.
          </p>
          <article
            v-for="(update, i) in updates || []"
            :key="i"
            class="mt-4"
          >
            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <LTStatus :status="update.status" />
                    <ULink
                      :to="`/orgs/${org_url_name}/projects/${url_name}/tasks/${update.task_id}`"
                      class="text-sm font-medium"
                    >
                      {{ update.task_title }}
                    </ULink>
                  </div>
                  <span class="text-xs text-neutral-500">{{ formatDate(update.created_at) }}</span>
                </div>
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
