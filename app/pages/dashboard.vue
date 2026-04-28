<script setup lang="ts">
  // const {data: projects, pending, error } = await useFetch(`/api/projects`);
  const projects = reactive([
    {
      name_url: "destine-phase-iii",
      title: "DestinE Phase III",
      description: "",
    },
    {
      name_url: "eurofusion-ach",
      title: "EuroFusion ACH",
      description: "",
    },
    {
      name_url: "pop3",
      title: "POP3",
      description: "",
    },
  ]);

  const open_project = ref({});
  for (const project of projects) {
    open_project.value[project.name_url] = reactive(false);
  }

  function expandAll() {
    console.log(projects)
    for (const project of projects) {
      open_project.value[project.name_url] = true;
      console.log(project.name_url)
      console.log(open_project.value[project.name_url])
    }
  }

  function collapseAll() {
    for (const project of projects) {
      open_project.value[project.name_url] = false;
      console.log(project.name_url)
      console.log(open_project.value[project.name_url])
    }
  }

  const sort_by = ref('Priority')
  const sort_by_options = ref(['Priority', 'Last Updated', 'Due at'])

  const show_actionable = ref(true);
</script>

<template>
  <UCard class="h-[89%]">
    <template #header>
      <div class="flex justify-between">
        <div>
          <UButton class="mr-3" color="neutral" variant="subtle" @click="collapseAll">Collapse All</UButton>
          <UButton class="mr-3" color="neutral" variant="subtle" @click="expandAll">Expand All</UButton>
        </div>
        <div>
          <UButton to="/projects/new">New Project</UButton>
        </div>
      </div>
    </template>

    <div class="flex mb-2">
      <UInput class="flex-1 mr-3" placeholder="Filter" v-model="project_filter" />
      <UTooltip text="Actionable" class="text-md font-semibold">
        <USwitch class="mr-3 mt-1" v-model="show_actionable" />
      </UTooltip>
      <UTooltip text="Sort by" class="text-md font-semibold">
        <USelect class="min-w-30" v-model="sort_by" :items="sort_by_options" />
      </UTooltip>
    </div>

    <UScrollArea>
      <article v-for="(project, index) in projects">
        <USeparator v-if="index != 0" class="mt-2 mb-2" />
        <LeafyTaskProjectSummary v-model="open_project[project.name_url]" :value="project"/>
      </article>
    </UScrollArea>
  </UCard>
</template>

