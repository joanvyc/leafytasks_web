<script setup lang="ts">
import type { ApiDateTime, DependableCandidate, StatusUpdate, TaskPriority, TaskStatus, TaskSummary } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string
const url_name = route.params.url_name as string
const taskId = route.params.id as string

const { data: task, error } = await useApiFetch<TaskSummary>(
  `/v1/orgs/${org_url_name}/projects/${url_name}/tasks/${taskId}`,
  { method: 'GET' }
)
if (error.value || !task.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? 'Task not found',
    fatal: true
  })
}

// `all` shows every dependency; `actionable` hides those waiting on their own deps.
const depsActionableOnly = ref(false)
const depsFilter = computed(() => (depsActionableOnly.value ? 'actionable' : 'all'))

const { data: dependencies } = await useApiFetch<TaskSummary[]>(
  `/v1/orgs/${org_url_name}/projects/${url_name}/tasks/${taskId}/deps`,
  { method: 'GET', query: { filter: depsFilter }, default: () => [] }
)

const recursive = ref(false)
const status_updates = ref<StatusUpdate[]>([
  { status: 'todo', description: 'Task created.', author: 'Alice Example', created_at: '2026-05-01' },
  { status: 'wip', description: 'Started working on the implementation.', author: 'Alice Example', created_at: '2026-05-10' }
])

const dependencySearch = ref('')
const dependencyCandidates = ref<DependableCandidate[]>([
  { id: 'cand-1', title: 'Candidate task A' },
  { id: 'cand-2', title: 'Candidate task B' }
])

type BadgeColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'

const priority_config: Record<TaskPriority, { color: BadgeColor, label: string }> = {
  low: { color: 'neutral', label: 'Low' },
  medium: { color: 'info', label: 'Medium' },
  high: { color: 'warning', label: 'High' },
  critical: { color: 'error', label: 'Critical' }
}

function priorityInfo(priority: string): { color: BadgeColor, label: string } {
  return priority_config[priority as TaskPriority] ?? { color: 'neutral', label: priority }
}

function formatDate(value: ApiDateTime | null | undefined): string {
  if (!value) return ''
  const [year, ordinal, hour, minute, second] = value
  return new Date(Date.UTC(year, 0, ordinal, hour, minute, second))
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

const status_options: { label: string, value: TaskStatus }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'WIP', value: 'wip' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Canceled', value: 'canceled' },
  { label: 'Done', value: 'done' }
]

const next_comment_text = ref('')
const next_status = ref<TaskStatus>(task.value?.status ?? 'todo')

function postUpdate(status: TaskStatus) {
  status_updates.value = [
    ...status_updates.value,
    {
      status,
      description: next_comment_text.value,
      author: 'You',
      created_at: new Date().toISOString().slice(0, 10)
    }
  ]
  if (task.value) task.value.status = status
  next_comment_text.value = ''
  next_status.value = status
}

function comment() {
  postUpdate(next_status.value)
}

function commentAndComplete() {
  postUpdate('done')
}
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
            :color="priorityInfo(task.priority).color"
            variant="outline"
          >
            {{ priorityInfo(task.priority).label }}
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
            v-model="next_comment_text"
            class="w-full mb-2"
            placeholder="Add a status update..."
          />
          <div class="flex justify-end items-center gap-2 mb-6">
            <USelect
              v-model="next_status"
              :items="status_options"
              class="min-w-32"
            />
            <UButton @click="comment">
              Comment
            </UButton>
            <UButton
              color="success"
              @click="commentAndComplete"
            >
              Comment and complete
            </UButton>
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
              :color="priorityInfo(task.priority).color"
              variant="outline"
            >
              {{ priorityInfo(task.priority).label }}
            </UBadge>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Assignee
            </p>
            <p class="break-all">
              {{ task.assignee_id }}
            </p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Due date
            </p>
            <p>{{ formatDate(task.due_at) }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Created
            </p>
            <p>{{ formatDate(task.created_at) }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Updated
            </p>
            <p>{{ formatDate(task.updated_at) }}</p>
          </div>
          <USeparator />
          <div>
            <div class="flex items-center justify-between mb-1">
              <p class="text-neutral-500">
                Dependencies
              </p>
              <USwitch
                v-model="depsActionableOnly"
                label="Actionable only"
                size="xs"
              />
            </div>
            <div
              v-for="dep in dependencies"
              :key="dep.id"
              :class="['flex items-center gap-2 mb-1 rounded border px-2 py-1', taskTint(dep.actionable)]"
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
