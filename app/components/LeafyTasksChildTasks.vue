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
  id: string | null
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

interface CreatedTask {
  id: string
  taskTitle?: string
  description?: string
}

function stubTask(id: string, title: string, status: TaskSummary['status'] = 'pending'): TaskSummary {
  return {
    id,
    title,
    description: '',
    status,
    priority: 'medium',
    assignee_id: '',
    due_at: '',
    updated_at: '2026-05-15',
    completed_at: ''
  }
}

const subtasks = ref<TaskSummary[]>([
  stubTask('s-1', 'Subtask one', 'wip'),
  stubTask('s-2', 'Subtask two', 'pending')
])
const leafs = ref<TaskSummary[]>([
  stubTask('l-1', 'Leaf task one', 'done'),
  stubTask('l-2', 'Leaf task two', 'blocked')
])

function newTaskPrompt(id: string, link_as: LinkAs) {
  if (new_task.id == id && new_task.link_as == link_as) {
    clearNewTask()
    return
  }
  new_task.id = id
  new_task.link_as = link_as
  new_task_prompt_open.value = true
}

function clearNewTask() {
  new_task.id = null
  new_task.link_as = null
  new_task.taskTitle = ''
  new_task.description = ''
  new_task_prompt_open.value = false
}

function createNewTask(): CreatedTask | null {
  const title = new_task.taskTitle.trim()
  if (!title) {
    clearNewTask()
    return null
  }
  const id = `t-${Date.now()}`
  subtasks.value = [
    ...subtasks.value,
    stubTask(id, title, 'pending')
  ]
  const created: CreatedTask = {
    id,
    taskTitle: title,
    description: new_task.description
  }
  clearNewTask()
  return created
}

function handleSubmit() {
  createNewTask()
}

function createNewTaskAndOpen() {
  const created = createNewTask()
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
  <UTabs
    :items="task_items"
    variant="link"
  >
    <template
      v-if="subtasks?.length"
      #subtasks
    >
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
    <template
      v-if="leafs?.length"
      #leaftasks
    >
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
</template>
