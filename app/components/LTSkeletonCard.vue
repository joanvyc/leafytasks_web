<script setup lang="ts">
// A loading placeholder shaped like a UCard: an optional header line plus a few
// body lines of shimmering skeleton. Used while a section's data is still
// loading so the page shell can render immediately.
withDefaults(defineProps<{
  header?: boolean
  lines?: number
}>(), {
  header: true,
  lines: 3
})
</script>

<template>
  <UCard>
    <template
      v-if="header"
      #header
    >
      <USkeleton class="h-5 w-32" />
    </template>
    <div class="flex flex-col gap-2">
      <USkeleton
        v-for="i in lines"
        :key="i"
        :class="['h-4', i === lines ? 'w-2/3' : 'w-full']"
      />
    </div>
  </UCard>
</template>
