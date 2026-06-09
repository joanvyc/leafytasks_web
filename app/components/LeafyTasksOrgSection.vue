<script setup lang="ts">
import type { Org, Project } from '~/types/api'

const props = defineProps<{
  org: Org
}>()

const { data: projects, status } = useApiFetch<Project[]>(
  `/v1/orgs/${props.org.url_name}/projects`,
  { method: 'GET', lazy: true, default: () => [] }
)

const open_project = ref<Record<string, boolean>>({})
watchEffect(() => {
  for (const project of projects.value ?? []) {
    if (!(project.url_name in open_project.value)) {
      open_project.value[project.url_name] = false
    }
  }
})
</script>

<template>
  <section>
    <div class="flex justify-between items-center mb-2">
      <ULink
        :to="`/orgs/${props.org.url_name}`"
        class="text-lg font-bold hover:underline"
      >
        {{ props.org.title }}
      </ULink>
      <UButton
        size="sm"
        :to="`/orgs/${props.org.url_name}/projects/new`"
      >
        New Project
      </UButton>
    </div>

    <div
      v-if="status === 'pending'"
      class="flex flex-col gap-2 ml-3 mb-2"
    >
      <USkeleton
        v-for="i in 2"
        :key="i"
        class="h-8 w-full"
      />
    </div>
    <p
      v-else-if="!projects?.length"
      class="text-sm text-neutral-500 ml-3 mb-2"
    >
      No projects yet.
    </p>

    <article
      v-for="(project, index) in projects || []"
      :key="project.url_name"
    >
      <USeparator
        v-if="index != 0"
        class="mt-2 mb-2"
      />
      <LeafyTaskProjectSummary
        v-model="open_project[project.url_name]"
        :org-url-name="props.org.url_name"
        :value="project"
      />
    </article>
  </section>
</template>
