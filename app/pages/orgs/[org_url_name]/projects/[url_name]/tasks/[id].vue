<script setup lang="ts">
import type { DependableCandidate, StatusUpdate, Task, TaskPriority } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string
const url_name = route.params.url_name as string
const taskId = route.params.id as string

const taskBase = `/api/orgs/${org_url_name}/projects/${url_name}/tasks/${taskId}`

const { data: task, error: taskError } = await useApiFetch<Task>(
  taskBase,
  { method: 'GET' }
)
if (taskError.value || !task.value) {
  throw createError({
    statusCode: taskError.value?.statusCode ?? 404,
    statusMessage: taskError.value?.statusMessage ?? 'Task not found',
    fatal: true
  })
}

const recursive = ref(false)
const { data: status_updates } = await useApiFetch<StatusUpdate[]>(
  `${taskBase}/status`,
  { method: 'GET', query: { recursive } }
)

const dependencySearch = ref('')
const { data: dependencyCandidates } = await useApiFetch<DependableCandidate[]>(
  `${taskBase}/dependable`,
  { method: 'GET', query: { q: dependencySearch }, default: () => [] }
)

type BadgeColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'

const priority_config: Record<TaskPriority, { color: BadgeColor, label: string }> = {
  low: { color: 'neutral', label: 'Low' },
  medium: { color: 'info', label: 'Medium' },
  high: { color: 'warning', label: 'High' },
  critical: { color: 'error', label: 'Critical' }
}

const next_status_text = ref('')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 flex justify-between items-center">
        <ULink
          :to="`/orgs/${org_url_name}/projects/${url_name}`"
          class="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← {{ url_name }}
        </ULink>
        <div
          v-if="task"
          class="flex items-center gap-2"
        >
          <LTStatus :status="task.status" />
          <UBadge
            :color="priority_config[task.priority as TaskPriority].color"
            variant="outline"
          >
            {{ priority_config[task.priority as TaskPriority].label }}
          </UBadge>
        </div>
      </div>
    </div>

    <h1
      v-if="task"
      class="text-3xl font-bold"
    >
      {{ task.title }}
    </h1>

    <div
      v-if="task"
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
            {{ task.description }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Subtasks
            </h2>
          </template>
          <LeafyTasksChildTasks
            :org-url-name="org_url_name"
            :project-url-name="url_name"
            :task-id="taskId"
          />
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Activity
            </h2>
          </template>
          <UTextarea
            v-model="next_status_text"
            class="w-full mb-2"
            placeholder="Add a status update..."
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
            v-for="(update, i) in status_updates || []"
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
                <LTStatus :status="update.status" />
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
            Details
          </h2>
        </template>
        <div class="flex flex-col gap-3 text-sm">
          <div>
            <p class="text-neutral-500 mb-1">
              Status
            </p>
            <LTStatus :status="task.status" />
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Priority
            </p>
            <UBadge
              :color="priority_config[task.priority as TaskPriority].color"
              variant="outline"
            >
              {{ priority_config[task.priority as TaskPriority].label }}
            </UBadge>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Assignee
            </p>
            <UUser
              :name="task.assignee.name"
              :avatar="{
                src: task.assignee.avatar,
                loading: 'lazy'
              }"
            />
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Due date
            </p>
            <p>{{ task.due_at }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Created
            </p>
            <p>{{ task.created_at }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Updated
            </p>
            <p>{{ task.updated_at }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Dependencies
            </p>
            <div
              v-for="dep in task.dependencies"
              :key="dep.id"
              class="flex items-center gap-2 mb-1"
            >
              <LTStatus :status="dep.status" />
              <ULink :to="`/orgs/${org_url_name}/projects/${url_name}/tasks/${dep.id}`">{{ dep.title }}</ULink>
            </div>
            <UInput
              v-model="dependencySearch"
              placeholder="Add dependency..."
              class="w-full mt-2"
            />
            <div
              v-if="dependencyCandidates?.length"
              class="mt-1 flex flex-col gap-1"
            >
              <UButton
                v-for="c in dependencyCandidates"
                :key="c.id"
                variant="ghost"
                size="xs"
              >
                {{ c.title }}
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
