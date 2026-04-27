import type { FetchContext } from 'ofetch'

function resolveBaseURL() {
  const config = useRuntimeConfig()
  return import.meta.server ? config.internalApiBase : config.public.apiBase
}

async function authHeader(): Promise<Record<string, string>> {
  const { getToken } = useAuth()
  const token = await getToken.value()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function extractErrorMessage(ctx: FetchContext): string {
  const body = ctx.response?._data as string | { message?: string } | undefined
  const fromBody = typeof body === 'string' ? body : body?.message
  return fromBody
    || ctx.response?.statusText
    || ctx.error?.message
    || 'Request failed'
}

function toastApiError(ctx: FetchContext) {
  if (import.meta.server) return
  const toast = useToast()
  const status = ctx.response?.status
  toast.add({
    title: status ? `API error ${status}` : 'API error',
    description: extractErrorMessage(ctx),
    color: 'error'
  })
}

async function applyAuthHeader(ctx: FetchContext) {
  const headers = new Headers(ctx.options.headers as HeadersInit | undefined)
  const auth = await authHeader()
  if (auth.Authorization) headers.set('Authorization', auth.Authorization)
  ctx.options.headers = headers
}

export const useApiFetch: typeof useFetch = (url, options) => {
  const opts = (options ?? {}) as Record<string, unknown>

  return useFetch(url as Parameters<typeof useFetch>[0], {
    ...opts,
    baseURL: resolveBaseURL(),
    onRequest: applyAuthHeader,
    onResponseError: toastApiError
  } as Parameters<typeof useFetch>[1])
}

export async function $apiFetch<T>(
  url: string,
  options: Parameters<typeof $fetch>[1] = {}
): Promise<T> {
  const auth = await authHeader()
  const headers = new Headers((options?.headers as HeadersInit) || {})
  if (auth.Authorization) headers.set('Authorization', auth.Authorization)

  return $fetch<T>(url, {
    ...options,
    baseURL: resolveBaseURL(),
    headers,
    onResponseError: toastApiError
  })
}
