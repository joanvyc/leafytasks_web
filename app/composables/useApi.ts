import type { FetchContext } from 'ofetch'

export const useApiFetch = createUseFetch(() => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server
    ? process.env.INTERNAL_API_BASE
    : config.public.apiBase

  if (!baseURL && !import.meta.prerender) {
    throw new Error(
      import.meta.server
        ? 'INTERNAL_API_BASE env var is required at runtime'
        : 'NUXT_PUBLIC_API_BASE env var is required at runtime'
    )
  }

  return {
    baseURL: baseURL ?? '',
    async onRequest({ options }) {
      const { getToken } = useAuth()
      const token = await getToken.value()
      if (!token) return
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('Authorization', `Bearer ${token}`)
      options.headers = headers
    },
    onResponseError(ctx: FetchContext) {
      if (import.meta.server) return
      const data = ctx.response?._data as string | { message?: string } | undefined
      const message = (typeof data === 'string' ? data : data?.message)
        ?? ctx.response?.statusText
        ?? ctx.error?.message
        ?? 'Request failed'
      useToast().add({
        title: ctx.response?.status ? `API error ${ctx.response.status}` : 'API error',
        description: message,
        color: 'error'
      })
    }
  }
})

export function $apiFetch<T>(
  url: string,
  options?: Parameters<typeof $fetch>[1]
): Promise<T> {
  return useNuxtApp().$api<T>(url, options)
}
