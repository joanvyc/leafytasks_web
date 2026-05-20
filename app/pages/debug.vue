<script setup lang="ts">
import type { FetchError } from 'ofetch'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
const methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const method = ref<Method>('GET')
const path = ref('/v1/user')
const body = ref('{\n  \n}')
const loading = ref(false)

type SentRequest = {
  method: string
  url: string
  headers: Record<string, string>
  body: unknown
}

const response = ref<{
  status: number | string
  ok: boolean
  durationMs: number
  data: unknown
  request: SentRequest | null
} | null>(null)

const config = useRuntimeConfig()
const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth()

const tokenProbe = ref<string>('(click Probe token)')

async function probeToken() {
  try {
    const t = await getToken.value()
    tokenProbe.value = t ? `OK — length ${t.length}, prefix ${t.slice(0, 20)}…` : 'getToken() returned null'
  } catch (e) {
    tokenProbe.value = `threw: ${(e as Error).message}`
  }
}

const hasBody = computed(() => method.value !== 'GET' && method.value !== 'DELETE')

const formattedOutput = computed(() => {
  if (!response.value) return ''
  const { data } = response.value
  if (typeof data === 'string') return data
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
})

const formattedRequest = computed(() => {
  const req = response.value?.request
  if (!req) return ''
  const lines: string[] = []
  lines.push(`${req.method} ${req.url}`)
  for (const [k, v] of Object.entries(req.headers)) {
    lines.push(`${k}: ${v}`)
  }
  if (req.body !== undefined && req.body !== null) {
    lines.push('')
    if (typeof req.body === 'string') {
      lines.push(req.body)
    } else {
      try {
        lines.push(JSON.stringify(req.body, null, 2))
      } catch {
        lines.push(String(req.body))
      }
    }
  }
  return lines.join('\n')
})

async function send() {
  loading.value = true
  response.value = null
  const start = performance.now()

  const baseURL = config.public.apiBase ?? ''

  const opts: Record<string, unknown> = { method: method.value }

  if (hasBody.value) {
    const trimmed = body.value.trim()
    if (trimmed) {
      try {
        opts.body = JSON.parse(trimmed)
      } catch (e) {
        loading.value = false
        response.value = {
          status: 'JSON parse error',
          ok: false,
          durationMs: 0,
          data: (e as Error).message,
          request: null
        }
        return
      }
    }
  }

  const token = await getToken.value()
  const headers: Record<string, string> = {
    accept: 'application/json'
  }
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token.slice(0, 12)}…(redacted)`
  const captured: SentRequest = {
    method: method.value,
    url: `${baseURL}${path.value}`,
    headers,
    body: opts.body
  }

  try {
    const data = await $apiFetch(path.value, opts)
    response.value = {
      status: 200,
      ok: true,
      durationMs: Math.round(performance.now() - start),
      data,
      request: captured
    }
  } catch (e) {
    const err = e as FetchError
    response.value = {
      status: err.status ?? err.statusCode ?? 'ERR',
      ok: false,
      durationMs: Math.round(performance.now() - start),
      data: err.data ?? err.message ?? String(e),
      request: captured
    }
  } finally {
    loading.value = false
  }
}

function formatBody() {
  const trimmed = body.value.trim()
  if (!trimmed) return
  try {
    body.value = JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch {
    // leave as-is
  }
}

definePageMeta({
  title: 'API Debug'
})
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-xl font-bold">
        API Debug
      </h1>
      <p class="text-sm text-neutral-500">
        Authenticated requests through <code>$apiFetch</code> (Clerk Bearer token attached).
      </p>
    </template>

    <div class="flex flex-col gap-4">
      <div class="border rounded-md p-3 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 flex flex-col gap-1">
        <div>isLoaded: <strong>{{ isLoaded }}</strong></div>
        <div>isSignedIn: <strong>{{ isSignedIn }}</strong></div>
        <div>userId: <strong>{{ userId ?? '(null)' }}</strong></div>
        <div>sessionId: <strong>{{ sessionId ?? '(null)' }}</strong></div>
        <div class="flex gap-2 items-center">
          <UButton
            size="xs"
            variant="outline"
            @click="probeToken"
          >
            Probe token
          </UButton>
          <span>{{ tokenProbe }}</span>
        </div>
      </div>

      <div class="flex gap-2 items-stretch">
        <USelect
          v-model="method"
          :items="methods"
          class="w-32"
        />
        <UInput
          v-model="path"
          placeholder="/v1/user"
          class="flex-1"
          @keyup.enter="send"
        />
        <UButton
          :loading="loading"
          icon="i-lucide-send"
          @click="send"
        >
          Send
        </UButton>
      </div>

      <div
        v-if="hasBody"
        class="flex flex-col gap-1"
      >
        <div class="flex justify-between items-center">
          <label class="text-sm font-medium">Request body (JSON)</label>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-wand-sparkles"
            @click="formatBody"
          >
            Format
          </UButton>
        </div>
        <UTextarea
          v-model="body"
          :rows="8"
          class="font-mono"
          :ui="{ base: 'font-mono text-sm' }"
          placeholder="{ &quot;key&quot;: &quot;value&quot; }"
        />
      </div>

      <div
        v-if="response"
        class="flex flex-col gap-2"
      >
        <div class="flex gap-2 items-center text-sm">
          <UBadge
            :color="response.ok ? 'success' : 'error'"
            variant="subtle"
          >
            {{ response.status }}
          </UBadge>
          <span class="text-neutral-500">{{ response.durationMs }} ms</span>
        </div>

        <div
          v-if="formattedRequest"
          class="flex flex-col gap-1"
        >
          <label class="text-sm font-medium">Request</label>
          <pre class="bg-neutral-800 text-neutral-100 rounded-md p-4 text-xs overflow-auto max-h-[40vh] whitespace-pre-wrap break-words">{{ formattedRequest }}</pre>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Response</label>
          <pre class="bg-neutral-900 text-neutral-100 rounded-md p-4 text-xs overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">{{ formattedOutput }}</pre>
        </div>
      </div>
    </div>
  </UCard>
</template>
