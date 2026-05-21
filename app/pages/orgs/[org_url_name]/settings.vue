<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Org, OrgInvite, OrgMember, OrgRole } from '~/types/api'

interface InviteForm {
  email: string
  role: OrgRole
}

const toast = useToast()
const route = useRoute()
const org_url_name = route.params.org_url_name as string

const { data: orgs, error: orgsError } = await useApiFetch<Org[]>(
  '/v1/orgs',
  { method: 'GET', default: () => [] }
)
const org = computed(() => orgs.value?.find(o => o.url_name === org_url_name) ?? null)
if (orgsError.value || !org.value) {
  throw createError({
    statusCode: orgsError.value?.statusCode ?? 404,
    statusMessage: orgsError.value?.statusMessage ?? 'Organization not found',
    fatal: true
  })
}

const members = ref<OrgMember[]>([
  { id: 'm-1', email: 'alice@example.com', name: 'Alice Example', role: 'owner' },
  { id: 'm-2', email: 'bob@example.com', name: 'Bob Example', role: 'admin' },
  { id: 'm-3', email: 'carol@example.com', name: 'Carol Example', role: 'member' }
])

const invites = ref<OrgInvite[]>([
  { id: 'i-1', email: 'dave@example.com', role: 'member', created_at: '2026-05-01' }
])

const form = reactive<InviteForm>({
  email: '',
  role: 'member'
})

const role_options = [
  { label: 'Member', value: 'member' as const },
  { label: 'Admin', value: 'admin' as const }
]

const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(state: InviteForm): FormError[] {
  const errors: FormError[] = []
  if (!state.email.trim()) {
    errors.push({ name: 'email', message: 'Required' })
  } else if (!email_pattern.test(state.email.trim())) {
    errors.push({ name: 'email', message: 'Enter a valid email' })
  }
  return errors
}

function handleSubmit(_event: FormSubmitEvent<InviteForm>) {
  const email = form.email.trim()
  invites.value = [
    ...invites.value,
    {
      id: `i-${Date.now()}`,
      email,
      role: form.role,
      created_at: new Date().toISOString().slice(0, 10)
    }
  ]
  toast.add({
    title: 'Invitation sent',
    description: `Invited ${email} as ${form.role}`,
    color: 'success'
  })
  form.email = ''
  form.role = 'member'
}

function revokeInvite(invite: OrgInvite) {
  invites.value = invites.value.filter(i => i.id !== invite.id)
}

function roleColor(role: OrgRole): 'primary' | 'info' | 'neutral' {
  if (role === 'owner') return 'primary'
  if (role === 'admin') return 'info'
  return 'neutral'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <ULink
        :to="`/orgs/${org_url_name}`"
        class="text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← {{ org?.title }}
      </ULink>
      <UBadge
        color="primary"
        variant="soft"
        icon="lucide:settings"
      >
        Settings
      </UBadge>
    </div>

    <h1 class="text-3xl font-bold">
      {{ org?.title }} Settings
    </h1>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Invite a user
        </h2>
      </template>

      <UForm
        :state="form"
        :validate="validate"
        class="flex flex-col gap-4 sm:flex-row sm:items-start"
        @submit="handleSubmit"
      >
        <UFormField
          required
          name="email"
          label="Email"
          class="flex-1"
        >
          <UInput
            v-model="form.email"
            type="email"
            placeholder="user@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField
          required
          name="role"
          label="Role"
          class="sm:w-40"
        >
          <USelect
            v-model="form.role"
            :items="role_options"
            class="w-full"
          />
        </UFormField>

        <div class="sm:pt-6">
          <UButton
            type="submit"
            loading-auto
            icon="lucide:mail"
          >
            Send invite
          </UButton>
        </div>
      </UForm>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Pending invitations
        </h2>
      </template>

      <p
        v-if="!invites?.length"
        class="text-sm text-neutral-500"
      >
        No pending invitations.
      </p>
      <article
        v-for="(invite, i) in invites || []"
        :key="invite.id"
      >
        <USeparator
          v-if="i !== 0"
          class="mt-2 mb-2"
        />
        <div class="flex justify-between items-center px-3 py-2">
          <div>
            <p class="font-medium">
              {{ invite.email }}
            </p>
            <p class="text-xs text-neutral-500">
              Invited {{ invite.created_at }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UBadge
              :color="roleColor(invite.role)"
              variant="soft"
            >
              {{ invite.role }}
            </UBadge>
            <UButton
              color="error"
              variant="subtle"
              size="xs"
              icon="lucide:x"
              @click="revokeInvite(invite)"
            >
              Revoke
            </UButton>
          </div>
        </div>
      </article>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Members
        </h2>
      </template>

      <p
        v-if="!members?.length"
        class="text-sm text-neutral-500"
      >
        No members yet.
      </p>
      <article
        v-for="(member, i) in members || []"
        :key="member.id"
      >
        <USeparator
          v-if="i !== 0"
          class="mt-2 mb-2"
        />
        <div class="flex justify-between items-center px-3 py-2">
          <div>
            <p class="font-medium">
              {{ member.name || member.email }}
            </p>
            <p
              v-if="member.name"
              class="text-xs text-neutral-500"
            >
              {{ member.email }}
            </p>
          </div>
          <UBadge
            :color="roleColor(member.role)"
            variant="soft"
          >
            {{ member.role }}
          </UBadge>
        </div>
      </article>
    </UCard>
  </div>
</template>
