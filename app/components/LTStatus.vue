<script setup lang="ts">
  const props = defineProps({
    status: String,
  });

  const status_color = {
    done: "success",
    wip: "info",
    pending: "warning",
    blocked: "error",
  }

  const status_icon = {
    done: "material-symbols:check-circle-outline-rounded",
    wip: "material-symbols:progress-activity",
    pending: "material-symbols:circle-outline",
    blocked: "material-symbols:error-circle-rounded-sharp",
  }

  const status_name = {
    done: "Done",
    wip: "In Progress",
    pending: "Pending",
    blocked: "Blocked",
  }
</script>

<template>
  <UBadge :color="status_color[props.status]" :trailingIcon="status_icon[props.status]" variant="soft" class="flex justify-center">
    {{ status_name[props.status] }}
  </UBadge>
</template>
