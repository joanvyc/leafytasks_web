<script setup lang="ts">
import type { Org } from '~/types/api'

const { data: orgs } = await useApiFetch<Org[]>(
  '/v1/orgs',
  { method: 'GET', default: () => [] }
)
</script>

<template>
  <UCard class="h-[89%]">
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold">
          Dashboard
        </h1>
        <ULink
          to="/orgs"
          class="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Organizations →
        </ULink>
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
        v-for="(org, index) in orgs || []"
        :key="org.id"
      >
        <USeparator
          v-if="index != 0"
          class="mt-4 mb-4"
        />
        <LeafyTasksOrgSection :org="org" />
      </article>
    </UScrollArea>
  </UCard>
</template>
