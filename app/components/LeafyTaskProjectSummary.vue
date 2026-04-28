<script setup lang="ts">
const open = defineModel()

const props = defineProps({
  orgUrlName: {
    type: String,
    required: true
  },
  value: {
    type: Object as () => {
      name_url?: string
      title?: string
      description?: string
    },
    required: true
  }
})

const pending_project = null
const project = props.value

//  const { data: tasks, pending: pending_tasks, error: error_tasks } =
//    await useApiFetch(`/api/orgs/${props.orgUrlName}/projects/${props.value?.name_url}/tasks-leafs`, {
//      lazy: true,
//    });
const tasks = [
  {
    id: 1,
    title: 'Dummy task',
    path: 'Task one -> Task two -> Task 3 -> Dummy task',
    status: 'done'
  },
  {
    id: 2,
    title: 'Dummy task',
    path: 'Task one -> Task two -> Task 3 -> Dummy task',
    status: 'blocked'
  },
  {
    id: 3,
    title: 'Dummy task',
    path: 'Task one -> Task two -> Task 3 -> Dummy task',
    status: 'wip'
  },
  {
    id: 4,
    title: 'Dummy task',
    path: 'Task one -> Task two -> Task 3 -> Dummy task',
    status: 'pending'
  }
]

function getToggleIcon() {
  return open.value
    ? 'material-symbols:keyboard-double-arrow-down'
    : 'material-symbols:keyboard-double-arrow-right'
}
</script>

<template>
  <UPlaceholder
    v-if="pending_project === 'pending'"
    class="h-8"
  />
  <article v-else>
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
        @click="navigateTo(`/orgs/${props.orgUrlName}/projects/${props.value?.name_url}`)"
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
    <article
      v-for="task in tasks"
      :key="task.id"
    >
      <div class="m-1 px-3 py-1 rounded bg-[#EEFFEE] hover:bg-[#E9F9E9] border border-[#77DD77]">
        <ULink
          :to="`/orgs/${props.orgUrlName}/projects/${project.name_url}/tasks/${task.id}`"
          class="flex justify-between items-center"
        >
          <UTooltip
            :text="task.path"
            class="text-md font-semibold"
          >
            {{ task.title }}
          </UTooltip>

          <LTStatus :status="task.status" />
        </ULink>
      </div>
    </article>
  </div>
</template>
