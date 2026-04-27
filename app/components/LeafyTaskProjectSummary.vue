<script setup lang="ts">
  const open = defineModel()

  const props = defineProps({
    value: {
      name_url: String,
      title: String,
      description: String,
    },
  })

  const pending_project = null;
  const project = props.value;

//  const { data: tasks, pending: pending_tasks, error: error_tasks } =
//    await useFetch(`/api/project/${props.value?.name_url}/tasks-leafs`, {
//      lazy: true,
//    });
  const pending_task = null;
  const tasks = [
    {
      id: 1,
      title: "Dummy task",
      path: "Task one -> Task two -> Task 3 -> Dummy task",
      status: "done",
    },
    {
      id: 2,
      title: "Dummy task",
      path: "Task one -> Task two -> Task 3 -> Dummy task",
      status: "blocked",
    },
    {
      id: 3,
      title: "Dummy task",
      path: "Task one -> Task two -> Task 3 -> Dummy task",
      status: "wip",
    },
    {
      id: 4,
      title: "Dummy task",
      path: "Task one -> Task two -> Task 3 -> Dummy task",
      status: "pending",
    },
  ]

  function getToggleIcon() {
    return open.value
      ? "material-symbols:keyboard-double-arrow-down"
      : "material-symbols:keyboard-double-arrow-right";
  }
</script>

<template>
    <UPlaceholder v-if="pending_project === 'pending'" class="h-8" />
    <article v-else>
      <div class="flex mt-3 mr-2">
        <UButton
          variant="ghost"
          color="neutral"
          :icon="getToggleIcon()"
          @click="open = !open"
        />
        <UButton class="flex-1" variant="ghost" color="neutral" @click="navigateTo(`/projects/${props.value?.name_url}`)">
          <div><p class="font-bold font-size-xl">{{ props.value?.title }}</p></div>
        </UButton>
      </div>
    </article>

    <div class="ml-3" v-if="open">
      {{ props.value?.description }}
      <USeparator />
      <article v-for="task in tasks">
        <div class="m-1 px-3 py-1 rounded bg-[#EEFFEE] hover:bg-[#E9F9E9] border border-[#77DD77]">
          <ULink :to="`/projects/${project.name_url}/tasks/${task.id}`" class="flex justify-between items-center">
            <UTooltip :text="task.path" class="text-md font-semibold">
                {{ task.title }}
            </UTooltip>

            <LTStatus :status="task.status" />
          </ULink>
        </div>
      </article>
    </div>
</template>
