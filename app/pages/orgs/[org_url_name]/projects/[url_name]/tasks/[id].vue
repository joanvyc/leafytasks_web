<script setup lang="ts">
import type { DependableCandidate, StatusUpdate, Task, TaskPriority, TaskStatus } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string
const url_name = route.params.url_name as string
const taskId = route.params.id as string

const task = ref<Task>({
  id: taskId,
  title: 'Sample task',
  description: 'This is placeholder task content shown while the task API is not yet implemented.',
  status: 'wip',
  priority: 'medium',
  assignee_id: 'm-1',
  due_at: '2026-06-30',
  updated_at: '2026-05-15',
  completed_at: '',
  assignee: { name: 'Alice Example', avatar: 'https://gitlab.pm.bsc.es/uploads/-/system/user/avatar/216/avatar.png' },
  created_at: '2026-05-01',
  dependencies: [
    { id: 'dep-1', title: 'Dependency task one', status: 'done' },
    { id: 'dep-2', title: 'Dependency task two', status: 'blocked' }
  ]
})

const recursive = ref(false)
const status_updates = ref<StatusUpdate[]>([
  { status: 'pending', description: 'Task created.', author: 'Alice Example', created_at: '2026-05-01' },
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

const status_options: { label: string, value: TaskStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'WIP', value: 'wip' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Done', value: 'done' }
]

const next_comment_text = ref('')
const next_status = ref<TaskStatus>(task.value.status as TaskStatus)

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
  task.value.status = status
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
