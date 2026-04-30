<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

interface NewOrgForm {
  title: string
  url_name: string
}

const toast = useToast()

const form = reactive<NewOrgForm>({
  title: '',
  url_name: ''
})

const url_name_dirty = ref(false)

const url_name_pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(() => form.title, (t) => {
  if (!url_name_dirty.value) form.url_name = slugify(t)
})

function onUrlNameInput(event: Event) {
  url_name_dirty.value = true
  const raw = (event.target as HTMLInputElement).value
  form.url_name = slugify(raw)
}

function validate(state: NewOrgForm): FormError[] {
  const errors: FormError[] = []
  if (!state.title.trim()) {
    errors.push({ name: 'title', message: 'Required' })
  }
  if (!state.url_name) {
    errors.push({ name: 'url_name', message: 'Required' })
  } else if (!url_name_pattern.test(state.url_name)) {
    errors.push({
      name: 'url_name',
      message: 'Use lowercase letters, numbers and hyphens only'
    })
  }
  return errors
}

async function handleSubmit(_event: FormSubmitEvent<NewOrgForm>) {
  try {
    const created = await $apiFetch<{ url_name: string }>('/api/orgs/new', {
      method: 'POST',
      body: {
        title: form.title.trim(),
        url_name: form.url_name
      }
    })
    await navigateTo(`/orgs/${created.url_name}`)
  } catch (err) {
    toast.add({
      title: 'Error: Creating organization',
      description: (err as Error)?.message,
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <ULink
        to="/orgs"
        class="text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Organizations
      </ULink>
      <UBadge
        color="primary"
        variant="soft"
        icon="lucide:building-2"
      >
        New Organization
      </UBadge>
    </div>

    <h1 class="text-3xl font-bold">
      New Organization
    </h1>

    <UCard>
      <UForm
        :state="form"
        :validate="validate"
        class="flex flex-col gap-4"
        @submit="handleSubmit"
      >
        <UFormField
          required
          name="title"
          label="Title"
        >
          <UInput
            v-model="form.title"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          required
          name="url_name"
          label="URL name"
          help="Used in the organization URL. Lowercase letters, numbers and hyphens only."
        >
          <UInput
            :model-value="form.url_name"
            class="w-full"
            @input="onUrlNameInput"
          />
        </UFormField>

        <div class="flex justify-end gap-2 mt-2">
          <UButton
            color="neutral"
            variant="subtle"
            to="/orgs"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            loading-auto
          >
            Create
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>
