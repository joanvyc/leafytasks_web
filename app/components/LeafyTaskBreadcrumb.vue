<script setup lang="ts">
import type { TaskSummary } from '~/types/api'

const props = defineProps<{
  orgUrlName: string
  projectUrlName: string
  taskId: number | string
  title: string
}>()

// Ancestor chain ordered root → nearest parent. The endpoint includes the task
// itself, so drop that entry to leave just the ancestors.
const { data: ancestors } = useApiFetch<TaskSummary[]>(
  `/v1/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks/${props.taskId}/ancestors`,
  { method: 'GET', lazy: true, default: () => [] }
)

const chain = computed(() =>
  (ancestors.value ?? []).filter(a => String(a.id) !== String(props.taskId))
)
const root = computed(() => chain.value[0] ?? null)
const parent = computed(() => (chain.value.length >= 2 ? chain.value[chain.value.length - 1] : null))
const middle = computed(() => (chain.value.length >= 3 ? chain.value.slice(1, -1) : []))

function taskLink(id: number | string): string {
  return `/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks/${id}`
}
</script>

<template>
  <nav
    v-if="root"
    class="flex items-center flex-wrap gap-1 text-sm text-neutral-500"
  >
    <ULink
      :to="taskLink(root.id)"
      class="hover:text-neutral-700"
    >
      {{ root.title }}
    </ULink>

    <template v-if="middle.length">
      <span>/</span>
      <UPopover
        mode="hover"
        :open-delay="200"
        :close-delay="150"
      >
        <span class="cursor-default px-1 hover:text-neutral-700">…</span>
        <template #content>
          <div class="p-2 flex flex-col gap-1 text-sm w-64">
            <ULink
              v-for="a in chain"
              :key="a.id"
              :to="taskLink(a.id)"
              :class="['flex items-center gap-2 rounded border px-2 py-1', taskTint(a.actionable)]"
            >
              <LTStatus :status="a.status" />
              <span class="truncate">{{ a.title }}</span>
            </ULink>
          </div>
        </template>
      </UPopover>
    </template>

    <template v-if="parent">
      <span>/</span>
      <ULink
        :to="taskLink(parent.id)"
        class="hover:text-neutral-700"
      >
        {{ parent.title }}
      </ULink>
    </template>

    <span>/</span>
    <span class="text-neutral-700 font-medium">{{ title }}</span>
  </nav>
</template>
