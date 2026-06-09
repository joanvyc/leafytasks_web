<script setup lang="ts">
import type { Project, TaskSummary } from '~/types/api'

const open = defineModel<boolean>()

const props = defineProps({
  orgUrlName: {
    type: String,
    required: true
  },
  value: {
    type: Object as () => Pick<Project, 'url_name' | 'title' | 'description'>,
    required: true
  }
})

const project = props.value

// `all` shows every leaf task; `actionable` hides those waiting on dependencies.
const actionableOnly = ref(false)
const filter = computed(() => (actionableOnly.value ? 'actionable' : 'all'))

const { data: tasks, status, execute } = useApiFetch<TaskSummary[]>(
  `/v1/orgs/${props.orgUrlName}/projects/${project.url_name}/tasks`,
  {
    key: `leaftasks-${props.orgUrlName}-${project.url_name}`,
    method: 'GET',
    query: { leafs: true, filter },
    default: () => [],
    immediate: false
  }
)

// Load leaf tasks lazily the first time the project is expanded.
watch(open, (isOpen) => {
  if (isOpen && status.value === 'idle') execute()
}, { immediate: true })

function getToggleIcon() {
  return open.value
    ? 'material-symbols:keyboard-double-arrow-down'
    : 'material-symbols:keyboard-double-arrow-right'
}
</script>

<template>
  <article>
    <div class="flex mt-3 mr-2">
      <UButton
        variant="ghost"
        color="neutral"
        :icon="getToggleIcon()"
        @click="open = !open"
      />
      <UButton
        class="flex-1"
        variant="ghost"
        color="neutral"
        @click="navigateTo(`/orgs/${props.orgUrlName}/projects/${props.value?.url_name}`)"
      >
        <div>
          <p class="font-bold font-size-xl">
            {{ props.value?.title }}
          </p>
        </div>
      </UButton>
    </div>
  </article>

  <div
    v-if="open"
    class="ml-3"
  >
    {{ props.value?.description }}
    <USeparator />
    <div class="flex justify-end m-1">
      <USwitch
        v-model="actionableOnly"
        label="Actionable only"
      />
    </div>
    <UPlaceholder
      v-if="status === 'pending'"
      class="h-8 m-1"
    />
    <p
      v-else-if="!tasks?.length"
      class="text-sm text-neutral-500 m-1"
    >
      No tasks here yet.
    </p>
    <article
      v-for="task in tasks"
      :key="task.id"
    >
      <div :class="['m-1 px-3 py-1 rounded border', taskTint(task.actionable)]">
        <ULink
          :to="`/orgs/${props.orgUrlName}/projects/${project.url_name}/tasks/${task.id}`"
          class="flex justify-between items-center"
        >
          <span class="text-md font-semibold">{{ task.title }}</span>

          <LTStatus :status="task.status" />
        </ULink>
      </div>
    </article>
  </div>
</template>
