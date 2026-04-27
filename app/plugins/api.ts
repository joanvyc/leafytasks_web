import type { FetchContext } from 'ofetch'

export default defineNuxtPlugin(() => {
  const resolveBaseURL = (): string => {
    const value = import.meta.server
      ? process.env.INTERNAL_API_BASE
      : useRuntimeConfig().public.apiBase
    if (!value) {
      throw new Error(
        import.meta.server
          ? 'INTERNAL_API_BASE env var is required at runtime'
          : 'NUXT_PUBLIC_API_BASE env var is required at runtime'
      )
    }
    return value
  }

  const api = $fetch.create({
    async onRequest({ options }) {
      const baseURL = resolveBaseURL()
      console.log('[api plugin]', { server: import.meta.server, baseURL })
      options.baseURL = baseURL

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
  })

  return {
    provide: { api }
  }
})
