<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Org, OrgInvite, OrgMember, OrgRole, UserSummary } from '~/types/api'

interface InviteForm {
  user: UserSummary | undefined
  role: 'admin' | 'member'
}

const toast = useToast()
const route = useRoute()
const org_url_name = route.params.org_url_name as string

const { data: orgs, error: orgsError, status: orgsStatus } = useApiFetch<Org[]>(
  '/v1/orgs',
  { method: 'GET', lazy: true, default: () => [] }
)
const org = computed(() => orgs.value?.find(o => o.url_name === org_url_name) ?? null)
watch(orgsStatus, (s) => {
  if (s === 'error' || (s === 'success' && !org.value)) {
    showError(createError({
      statusCode: orgsError.value?.statusCode ?? 404,
      statusMessage: orgsError.value?.statusMessage ?? 'Organization not found',
      fatal: true
    }))
  }
})

const members = ref<OrgMember[]>([
  { id: 'm-1', email: 'alice@example.com', name: 'Alice Example', role: 'owner' },
  { id: 'm-2', email: 'bob@example.com', name: 'Bob Example', role: 'admin' },
  { id: 'm-3', email: 'carol@example.com', name: 'Carol Example', role: 'member' }
])

const invites = ref<OrgInvite[]>([
  { id: 'i-1', username: 'dave', role: 'member', created_at: '2026-05-01' }
])

const form = reactive<InviteForm>({
  user: undefined,
  role: 'member'
})

const role_options = [
  { label: 'Member', value: 'member' as const },
  { label: 'Admin', value: 'admin' as const }
]

const userSearch = ref('')
const userResults = ref<UserSummary[]>([])
const userSearchLoading = ref(false)
let userSearchTimer: ReturnType<typeof setTimeout> | null = null

watch(userSearch, (q) => {
  if (userSearchTimer) clearTimeout(userSearchTimer)
  const term = q.trim()
  if (!term) {
    userResults.value = []
    userSearchLoading.value = false
    return
  }
  userSearchLoading.value = true
  userSearchTimer = setTimeout(async () => {
    try {
      userResults.value = await $apiFetch<UserSummary[]>('/v1/users/list', {
        query: { filter: term }
      })
    } catch {
      userResults.value = []
    } finally {
      userSearchLoading.value = false
    }
  }, 250)
})

function validate(state: InviteForm): FormError[] {
  const errors: FormError[] = []
  if (!state.user) {
    errors.push({ name: 'user', message: 'Pick a user' })
  }
  return errors
}

function handleSubmit(_event: FormSubmitEvent<InviteForm>) {
  if (!form.user) return
  const username = form.user.username
  invites.value = [
    ...invites.value,
    {
      id: `i-${Date.now()}`,
      username,
      role: form.role,
      created_at: new Date().toISOString().slice(0, 10)
    }
  ]
  toast.add({
    title: 'Invitation sent',
    description: `Invited ${username} as ${form.role}`,
    color: 'success'
  })
  form.user = undefined
  form.role = 'member'
  userSearch.value = ''
  userResults.value = []
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

    <h1
      v-if="orgsStatus === 'pending'"
      class="text-3xl font-bold"
    >
      <USkeleton class="h-8 w-64" />
    </h1>
    <h1
      v-else
      class="text-3xl font-bold"
    >
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
          name="user"
          label="Username"
          class="flex-1"
        >
          <UInputMenu
            v-model="form.user"
            v-model:search-term="userSearch"
            :items="userResults"
            :loading="userSearchLoading"
            ignore-filter
            label-key="username"
            by="id"
            placeholder="Search users..."
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
              {{ invite.username }}
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
