<script setup lang="ts">
import type { Project, ProjectStatus, StatusUpdate } from '~/types/api'

const route = useRoute()
const org_url_name = route.params.org_url_name as string
const url_name = route.params.url_name as string

const { data: project, error: projectError } = await useApiFetch<Project>(
  `/api/orgs/${org_url_name}/projects/${url_name}`,
  { method: 'GET' }
)
if (projectError.value || !project.value) {
  throw createError({
    statusCode: projectError.value?.statusCode ?? 404,
    statusMessage: projectError.value?.statusMessage ?? 'Project not found',
    fatal: true
  })
}

const recursive = ref(false)
const { data: updates } = await useApiFetch<StatusUpdate[]>(
  `/api/orgs/${org_url_name}/projects/${url_name}/status`,
  { method: 'GET', query: { recursive } }
)

type BadgeColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'

const status_config: Record<ProjectStatus, { color: BadgeColor, label: string }> = {
  'active': { color: 'success', label: 'Active' },
  'on-hold': { color: 'warning', label: 'On Hold' },
  'completed': { color: 'neutral', label: 'Completed' },
  'archived': { color: 'neutral', label: 'Archived' }
}

const next_update_text = ref('')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 flex justify-between items-center">
        <ULink
          :to="`/orgs/${org_url_name}`"
          class="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← {{ org_url_name }}
        </ULink>
        <UBadge
          color="primary"
          variant="soft"
          icon="lucide:folder"
        >
          Project
        </UBadge>
      </div>
    </div>

    <h1
      v-if="project"
      class="text-3xl font-bold"
    >
      {{ project.title }}
    </h1>

    <div
      v-if="project"
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
            {{ project.description }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Tasks
            </h2>
          </template>
          <LeafyTasksChildTasks
            :org-url-name="org_url_name"
            :project-url-name="url_name"
          />
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Activity
            </h2>
          </template>
          <UTextarea
            v-model="next_update_text"
            class="w-full mb-2"
            placeholder="Add a project update..."
          />
          <div class="flex justify-end mb-6">
            <UButton>Submit</UButton>
          </div>
          <div class="flex justify-end mb-2">
            <USwitch
              v-model="recursive"
              label="Include subtasks"
            />
          </div>
          <article
            v-for="(update, i) in updates || []"
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
                <UBadge
                  :color="status_config[update.status as ProjectStatus].color"
                  variant="soft"
                >
                  {{ status_config[update.status as ProjectStatus].label }}
                </UBadge>
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
            Project Info
          </h2>
        </template>
        <div class="flex flex-col gap-3 text-sm">
          <div>
            <p class="text-neutral-500 mb-1">
              Status
            </p>
            <UBadge
              :color="status_config[project.status].color"
              variant="soft"
            >
              {{ status_config[project.status].label }}
            </UBadge>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-2">
              Progress
            </p>
            <p class="mb-2">
              {{ project.tasks_done }} / {{ project.tasks_total }} tasks done
            </p>
            <div class="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                class="h-full bg-primary-400 rounded-full"
                :style="{ width: `${Math.round((project.tasks_done / project.tasks_total) * 100)}%` }"
              />
            </div>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Owner
            </p>
            <UUser
              :name="project.owner.name"
              :avatar="{
                src: project.owner.avatar,
                loading: 'lazy'
              }"
            />
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Start date
            </p>
            <p>{{ project.start_date }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              End date
            </p>
            <p>{{ project.end_date }}</p>
          </div>
          <USeparator />
          <div>
            <p class="text-neutral-500 mb-1">
              Updated
            </p>
            <p>{{ project.updated_at }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
