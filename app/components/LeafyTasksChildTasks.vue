<script setup lang="ts">
import type { TaskSummary } from '~/types/api'

const props = defineProps({
  projectUrlName: String,
  taskId: String
})

const toast = useToast()

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

const subtasksUrl = props.taskId
  ? `/api/projects/${props.projectUrlName}/tasks/${props.taskId}/childs`
  : `/api/projects/${props.projectUrlName}/tasks`
const leafsUrl = props.taskId
  ? `/api/projects/${props.projectUrlName}/tasks/${props.taskId}/leafs`
  : `/api/projects/${props.projectUrlName}/tasks?leafs=true`

const { data: subtasks, refresh: refreshSubtasks } = await useApiFetch<TaskSummary[]>(
  subtasksUrl,
  { method: 'GET', default: () => [] }
)
const { data: leafs } = await useApiFetch<TaskSummary[]>(
  leafsUrl,
  { method: 'GET', default: () => [] }
)

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

async function createNewTask(): Promise<CreatedTask | null | undefined> {
  try {
    const created_task = await $apiFetch<CreatedTask>('/api/tasks/new', {
      method: 'POST',
      body: {
        title: new_task.taskTitle,
        description: new_task.description,
        parent_id: new_task.link_as === 'parent'
          ? new_task.id
          : null,
        dependencies: new_task.link_as === 'followup'
          ? [new_task.id]
          : []
      }
    })

    await refreshSubtasks()
    clearNewTask()
    return created_task
  } catch (err) {
    toast.add({
      title: 'Error: Creating task',
      description: (err as Error)?.message
    })
    clearNewTask()
    return null
  }
}

async function handleSubmit() {
  await createNewTask()
}

async function createNewTaskAndOpen() {
  const created = await createNewTask()
  if (created) navigateTo(`/projects/${props.projectUrlName}/tasks/${created.id}`)
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
              <ULink :to="`/projects/${props.projectUrlName}/tasks/${task.id}`">
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
          <ULink :to="`/projects/${props.projectUrlName}/tasks/${task.id}`">
            <h2 class="m-2">{{ task.title }}</h2>
          </ULink>
        </div>
      </article>
    </template>
  </UTabs>
</template>
