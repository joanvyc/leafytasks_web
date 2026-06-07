<script setup lang="ts">
const props = withDefaults(defineProps<{ status?: string }>(), {
  status: ''
})

const status_color: Record<string, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
  done: 'success',
  wip: 'info',
  todo: 'warning',
  blocked: 'error',
  canceled: 'neutral'
}

const status_icon: Record<string, string> = {
  done: 'material-symbols:check-circle-outline-rounded',
  wip: 'material-symbols:progress-activity',
  todo: 'material-symbols:circle-outline',
  blocked: 'material-symbols:error-circle-rounded-sharp',
  canceled: 'material-symbols:cancel-outline-rounded'
}

const status_name: Record<string, string> = {
  done: 'Done',
  wip: 'In Progress',
  todo: 'To Do',
  blocked: 'Blocked',
  canceled: 'Canceled'
}
</script>

<template>
  <UBadge
    :color="status_color[props.status]"
    :trailing-icon="status_icon[props.status]"
    variant="soft"
    class="flex justify-center"
  >
    {{ status_name[props.status] }}
  </UBadge>
</template>
