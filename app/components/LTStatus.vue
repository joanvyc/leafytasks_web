<script setup lang="ts">
const props = withDefaults(defineProps<{ status?: string }>(), {
  status: ''
})

const status_color: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  done: 'success',
  wip: 'info',
  pending: 'warning',
  blocked: 'error'
}

const status_icon: Record<string, string> = {
  done: 'material-symbols:check-circle-outline-rounded',
  wip: 'material-symbols:progress-activity',
  pending: 'material-symbols:circle-outline',
  blocked: 'material-symbols:error-circle-rounded-sharp'
}

const status_name: Record<string, string> = {
  done: 'Done',
  wip: 'In Progress',
  pending: 'Pending',
  blocked: 'Blocked'
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
