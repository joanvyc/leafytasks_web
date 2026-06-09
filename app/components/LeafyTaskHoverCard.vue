<script setup lang="ts">
import type { TaskSummary } from '~/types/api'

const props = defineProps<{
  orgUrlName: string
  projectUrlName: string
  taskId: number | string
}>()

// Captured once: $api is a plain ofetch instance, so it stays valid across the
// awaits in the recursive origin walk (no Nuxt context needed per call).
const { $api } = useNuxtApp()

function taskUrl(id: number | string): string {
  return `/v1/orgs/${props.orgUrlName}/projects/${props.projectUrlName}/tasks/${id}`
}

const open = ref(false)
const loaded = ref(false)
const loading = ref(false)
const ancestors = ref<TaskSummary[]>([])
const dependencies = ref<{ dep: TaskSummary, origins: TaskSummary[] }[]>([])

// Walk the dependency tree following satisfied edges; a node with no satisfied
// children is a frontier — keep it as an origin only when it is actionable. The
// direct dependency itself is never listed as its own origin.
async function collect(node: TaskSummary, isRoot: boolean, found: Map<number, TaskSummary>, visited: Set<number>) {
  if (visited.has(node.id)) return
  visited.add(node.id)
  const children = await $api<TaskSummary[]>(`${taskUrl(node.id)}/deps`, { query: { filter: 'satisfied' } }) ?? []
  if (children.length === 0) {
    if (!isRoot && node.actionable) found.set(node.id, node)
    return
  }
  for (const child of children) await collect(child, false, found, visited)
}

async function originsFor(dep: TaskSummary): Promise<TaskSummary[]> {
  const found = new Map<number, TaskSummary>()
  await collect(dep, true, found, new Set<number>())
  return [...found.values()]
}

async function load() {
  if (loaded.value || loading.value) return
  loading.value = true
  try {
    const [anc, direct] = await Promise.all([
      $api<TaskSummary[]>(`${taskUrl(props.taskId)}/ancestors`),
      $api<TaskSummary[]>(`${taskUrl(props.taskId)}/deps`, { query: { filter: 'all' } })
    ])
    ancestors.value = anc ?? []
    dependencies.value = await Promise.all(
      (direct ?? []).map(async dep => ({ dep, origins: await originsFor(dep) }))
    )
    loaded.value = true
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) load()
})
</script>

<template>
  <UPopover
    v-model:open="open"
    mode="hover"
    :open-delay="300"
    :close-delay="150"
    :content="{ side: 'right', align: 'start' }"
  >
    <slot />

    <template #content>
      <div class="p-3 w-72 text-sm flex flex-col gap-3">
        <p
          v-if="loading"
          class="text-neutral-500"
        >
          Loading…
        </p>
        <template v-else>
          <section>
            <p class="font-semibold mb-1">
              Hierarchy
            </p>
            <p
              v-if="!ancestors.length"
              class="text-neutral-500"
            >
              No parent tasks.
            </p>
            <div
              v-for="a in ancestors"
              :key="a.id"
              :class="['flex items-center gap-2 rounded border px-2 py-1 mb-1', taskTint(a.actionable)]"
            >
              <LTStatus :status="a.status" />
              <span class="truncate">{{ a.title }}</span>
            </div>
          </section>

          <section>
            <p class="font-semibold mb-1">
              Dependencies
            </p>
            <p
              v-if="!dependencies.length"
              class="text-neutral-500"
            >
              No dependencies.
            </p>
            <div
              v-for="d in dependencies"
              :key="d.dep.id"
              class="mb-1"
            >
              <div :class="['flex items-center gap-2 rounded border px-2 py-1', taskTint(d.dep.actionable)]">
                <LTStatus :status="d.dep.status" />
                <span class="truncate">{{ d.dep.title }}</span>
              </div>
              <div
                v-for="o in d.origins"
                :key="o.id"
                :class="['flex items-center gap-2 rounded border px-2 py-1 mt-1 ml-4', taskTint(o.actionable)]"
              >
                <LTStatus :status="o.status" />
                <span class="truncate">{{ o.title }}</span>
              </div>
            </div>
          </section>
        </template>
      </div>
    </template>
  </UPopover>
</template>
