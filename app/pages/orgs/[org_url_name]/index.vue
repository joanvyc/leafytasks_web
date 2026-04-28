<script setup lang="ts">
import type { Org } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string

const { data: org, error: orgError } = await useApiFetch<Org>(
  '/api/orgs',
  { method: 'GET', query: { url_name: org_url_name } }
)
if (orgError.value || !org.value) {
  throw createError({
    statusCode: orgError.value?.statusCode ?? 404,
    statusMessage: orgError.value?.statusMessage ?? 'Organization not found',
    fatal: true
  })
}

// const { data: projects } = await useApiFetch(`/api/orgs/${org_url_name}/projects`)
const projects = reactive([
  { name_url: 'destine-phase-iii', title: 'DestinE Phase III', description: '' },
  { name_url: 'eurofusion-ach', title: 'EuroFusion ACH', description: '' },
  { name_url: 'pop3', title: 'POP3', description: '' }
])

const open_project = ref<Record<string, boolean>>({})
for (const project of projects) {
  open_project.value[project.name_url] = false
}

function expandAll() {
  for (const project of projects) {
    open_project.value[project.name_url] = true
  }
}

function collapseAll() {
  for (const project of projects) {
    open_project.value[project.name_url] = false
  }
}

const project_filter = ref('')
const sort_by = ref('Priority')
const sort_by_options = ref(['Priority', 'Last Updated', 'Due at'])
const show_actionable = ref(true)
</script>

<template>
  <UCard class="h-[89%]">
    <template #header>
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <ULink
            to="/dashboard"
            class="text-sm text-neutral-500 hover:text-neutral-700"
          >
            ← Dashboard
          </ULink>
          <UBadge
            color="primary"
            variant="soft"
            icon="lucide:building"
          >
            Organization
          </UBadge>
        </div>
        <h1 class="text-2xl font-bold">
          {{ org?.title }}
        </h1>
        <div class="flex justify-between">
          <div>
            <UButton
              class="mr-3"
              color="neutral"
              variant="subtle"
              @click="collapseAll"
            >
              Collapse All
            </UButton>
            <UButton
              class="mr-3"
              color="neutral"
              variant="subtle"
              @click="expandAll"
            >
              Expand All
            </UButton>
          </div>
          <div>
            <UButton :to="`/orgs/${org_url_name}/projects/new`">
              New Project
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <div class="flex mb-2">
      <UInput
        v-model="project_filter"
        class="flex-1 mr-3"
        placeholder="Filter"
      />
      <UTooltip
        text="Actionable"
        class="text-md font-semibold"
      >
        <USwitch
          v-model="show_actionable"
          class="mr-3 mt-1"
        />
      </UTooltip>
      <UTooltip
        text="Sort by"
        class="text-md font-semibold"
      >
        <USelect
          v-model="sort_by"
          class="min-w-30"
          :items="sort_by_options"
        />
      </UTooltip>
    </div>

    <UScrollArea>
      <article
        v-for="(project, index) in projects"
        :key="project.name_url"
      >
        <USeparator
          v-if="index != 0"
          class="mt-2 mb-2"
        />
        <LeafyTaskProjectSummary
          v-model="open_project[project.name_url]"
          :org-url-name="org_url_name"
          :value="project"
        />
      </article>
    </UScrollArea>
  </UCard>
</template>
