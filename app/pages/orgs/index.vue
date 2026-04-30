<script setup lang="ts">
import type { Org } from '~/types/api'

const { data: orgs } = await useApiFetch<Org[]>(
  '/api/orgs',
  { method: 'GET', default: () => [] }
)
</script>

<template>
  <UCard class="h-[89%]">
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold">
          Organizations
        </h1>
        <div class="flex items-center gap-3">
          <UButton
            to="/orgs/new"
            icon="lucide:plus"
            size="xs"
          >
            New
          </UButton>
          <ULink
            to="/dashboard"
            class="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Dashboard →
          </ULink>
        </div>
      </div>
    </template>

    <UScrollArea>
      <p
        v-if="!orgs?.length"
        class="text-sm text-neutral-500"
      >
        You are not a member of any organization yet.
      </p>
      <article
        v-for="(org, i) in orgs || []"
        :key="org.id"
      >
        <USeparator
          v-if="i !== 0"
          class="mt-2 mb-2"
        />
        <ULink
          :to="`/orgs/${org.url_name}`"
          class="block px-3 py-2 rounded hover:bg-neutral-100"
        >
          <p class="font-bold">
            {{ org.title }}
          </p>
          <p class="text-xs text-neutral-500">
            {{ org.url_name }}
          </p>
        </ULink>
      </article>
    </UScrollArea>
  </UCard>
</template>
