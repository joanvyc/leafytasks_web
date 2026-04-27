import type { FetchContext } from 'ofetch'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.internalApiBase : config.public.apiBase

  const api = $fetch.create({
    baseURL,
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
  })

  return {
    provide: { api }
  }
})
