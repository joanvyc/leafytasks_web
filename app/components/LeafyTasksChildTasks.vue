<script setup lang="ts">
import type { TaskSummary } from '~/types/api'

const props = defineProps({
  orgUrlName: { type: String, required: true },
  projectUrlName: String,
  taskId: String
})

type LinkAs = 'parent' | 'followup'

const new_task_prompt_open = ref(false)
const new_task = reactive<{
  id: number | null
  link_as: LinkAs | null
  taskTitle: string
  description: string
}>({
  id: null,
  link_as: null,
  taskTitle: '',
  description: ''
})

const new_task_title: Record<LinkAs, string> = {
  parent: 'Sub-task',
  followup: 'Follow up task'
}

const tasksUrl = `/v1/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks`

const taskScope = `${props.orgUrlName}/${props.projectUrlName}/${props.taskId ?? 'root'}`
const parentId = props.taskId ? Number(props.taskId) : null

// On a task page we ask the API directly for this task's sub-tasks via the
// dedicated `/sub` endpoint; on a project page we list every project task and
// keep the root-level ones.
const subUrl = props.taskId ? `${tasksUrl}/${props.taskId}/sub` : tasksUrl

// `all` shows every task; `actionable` hides tasks still waiting on dependencies.
const actionableOnly = ref(false)
const filter = computed(() => (actionableOnly.value ? 'actionable' : 'all'))

// The `/sub` endpoint splits this task's sub-tasks (`leafs=false`) from its leaf
// tasks (`leafs=true`) and honours the `filter` query param for both.
const subQuery = props.taskId ? { leafs: false, filter } : {}
const leafQuery = props.taskId ? { leafs: true, filter } : { leafs: true }

const { data: subList, refresh: refreshSubtasks } = await useApiFetch<TaskSummary[]>(
  subUrl,
  { key: `tasks-${taskScope}-sub`, method: 'GET', query: subQuery, default: () => [] }
)
const { data: leafs, refresh: refreshLeafs } = await useApiFetch<TaskSummary[]>(
  subUrl,
  { key: `tasks-${taskScope}-leafs`, method: 'GET', query: leafQuery, default: () => [] }
)

// The `/sub` endpoint already returns this task's direct sub-tasks; on a project
// page we get every task, so keep only the root-level ones.
const subtasks = computed(() =>
  props.taskId ? (subList.value ?? []) : (subList.value ?? []).filter(t => t.parent_id === parentId)
)

function refreshTasks() {
  return Promise.all([refreshSubtasks(), refreshLeafs()])
}

function newTaskPrompt(id: number, link_as: LinkAs) {
  if (new_task.id == id && new_task.link_as == link_as) {
    clearNewTask()
    return
  }
  new_task.id = id
  new_task.link_as = link_as
  new_task_prompt_open.value = true
}

// Open the form for a task that has no linked task: a sub-task of the current
// task when rendered on a task page, or a root task when on a project page.
function newRootTaskPrompt() {
  if (new_task_prompt_open.value && new_task.id === null) {
    clearNewTask()
    return
  }
  new_task.id = null
  new_task.link_as = null
  new_task_prompt_open.value = true
}

function clearNewTask() {
  new_task.id = null
  new_task.link_as = null
  new_task.taskTitle = ''
  new_task.description = ''
  new_task_prompt_open.value = false
}

async function createNewTask(): Promise<{ id: number } | null> {
  const title = new_task.taskTitle.trim()
  if (!title) {
    clearNewTask()
    return null
  }
  const link_id = new_task.id
  let parent_id: number | null = parentId
  let dependencies: number[] = []
  if (new_task.link_as === 'parent') {
    parent_id = link_id
  } else if (new_task.link_as === 'followup' && link_id != null) {
    dependencies = [link_id]
  }
  const created = await $apiFetch<{ id: number }>(
    `/v1/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks`,
    { method: 'POST', body: { title, description: new_task.description, parent_id, dependencies } }
  )
  clearNewTask()
  await refreshTasks()
  return created
}

async function handleSubmit() {
  await createNewTask()
}

async function createNewTaskAndOpen() {
  const created = await createNewTask()
  if (created) navigateTo(`/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks/${created.id}`)
}

const task_items = [
  {
    label: 'Subtasks',
    slot: 'subtasks'
  },
  {
    label: 'Leaf Tasks',
    slot: 'leaftasks'
  }
]
</script>

<template>
  <div>
    <div
      class="flex items-center mb-2"
      :class="taskId ? 'justify-between' : 'justify-end'"
    >
      <USwitch
        v-if="taskId"
        v-model="actionableOnly"
        label="Actionable only"
      />
      <UButton
        size="sm"
        icon="material-symbols:add-rounded"
        :variant="new_task_prompt_open && new_task.id === null ? 'soft' : 'solid'"
        @click="newRootTaskPrompt"
      >
        {{ taskId ? 'New sub-task' : 'New task' }}
      </UButton>
    </div>

    <article
      v-if="new_task_prompt_open && new_task.id === null"
      class="border border-[#AAAAAA] bg-[#FFFFFF] rounded-md mb-3 p-2"
    >
      <UForm
        :state="new_task"
        @submit="handleSubmit"
      >
        <UFormField
          as="div"
          class="w-full"
          required
          name="taskTitle"
          :label="taskId ? 'New sub-task' : 'New task'"
        >
          <UInput
            v-model="new_task.taskTitle"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          as="div"
          class="w-full mt-3"
          name="description"
          label="Description"
        >
          <UTextarea
            v-model="new_task.description"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-col items-end">
          <div class="mt-3">
            <UButton
              class="ml-1"
              color="neutral"
              @click="clearNewTask"
            >
              Cancel
            </UButton>
            <UButton
              class="ml-1"
              loading-auto
              @click="createNewTaskAndOpen"
            >
              Create and open
            </UButton>
            <UButton
              class="ml-1"
              type="submit"
              loading-auto
            >
              Create
            </UButton>
          </div>
        </div>
      </UForm>
    </article>

    <UTabs
      :items="task_items"
      variant="link"
    >
      <template #subtasks>
        <p
          v-if="!subtasks.length"
          class="text-sm text-neutral-500 text-center py-4"
        >
          No tasks here yet.
        </p>
        <article
          v-for="task in subtasks"
          :key="task.id"
        >
          <div class="border border-[#AAAAAA] bg-[#FFFFFF] rounded-md mb-1">
            <div class="flex justify-between items-center">
              <div>
                <ULink :to="`/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks/${task.id}`">
                  <h2 class="m-2">{{ task.title }}</h2>
                </ULink>
              </div>
              <div>
                <UTooltip text="New sub-task">
                  <UButton
                    class="mr-1"
                    size="sm"
                    icon="material-symbols:account-tree-rounded"
                    @click="newTaskPrompt(task.id, 'parent')"
                  />
                </UTooltip>
                <UTooltip text="New follow-up task">
                  <UButton
                    class="mr-1"
                    size="sm"
                    icon="material-symbols:arrow-cool-down"
                    @click="newTaskPrompt(task.id, 'followup')"
                  />
                </UTooltip>
              </div>
            </div>
            <article
              v-if="new_task.id === task.id"
              class="m-2"
            >
              <USeparator class="mb-2 mt-2" />
              <UForm
                :state="new_task"
                @submit="handleSubmit"
              >
                <UFormField
                  as="div"
                  class="w-full"
                  required
                  name="taskTitle"
                  :label="new_task.link_as ? new_task_title[new_task.link_as] : ''"
                >
                  <UInput
                    v-model="new_task.taskTitle"
                    class="w-full"
                    autofocus
                  />
                </UFormField>

                <UFormField
                  as="div"
                  class="w-full mt-3"
                  name="description"
                  label="Description"
                >
                  <UTextarea
                    v-model="new_task.description"
                    class="w-full"
                  />
                </UFormField>

                <div class="flex flex-col items-end">
                  <div class="mt-3">
                    <UButton
                      class="ml-1"
                      color="neutral"
                      @click="clearNewTask"
                    >
                      Cancel
                    </UButton>
                    <UButton
                      class="ml-1"
                      loading-auto
                      @click="createNewTaskAndOpen"
                    >
                      Create and open
                    </UButton>
                    <UButton
                      class="ml-1"
                      type="submit"
                      loading-auto
                    >
                      Create
                    </UButton>
                  </div>
                </div>
              </UForm>
            </article>
          </div>
        </article>
      </template>
      <template #leaftasks>
        <p
          v-if="!leafs?.length"
          class="text-sm text-neutral-500 text-center py-4"
        >
          No tasks here yet.
        </p>
        <article
          v-for="task in leafs"
          :key="task.id"
        >
          <div class="border border-[#AAAAAA] bg-[#FFFFFF] rounded-md mb-1">
            <ULink :to="`/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks/${task.id}`">
              <h2 class="m-2">{{ task.title }}</h2>
            </ULink>
          </div>
        </article>
      </template>
    </UTabs>
  </div>
</template>
