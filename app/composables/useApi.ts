export const useApiFetch = createUseFetch(() => ({
  $fetch: useNuxtApp().$api as typeof $fetch
}))

export function $apiFetch<T>(
  url: string,
  options?: Parameters<typeof $fetch>[1]
): Promise<T> {
  return useNuxtApp().$api<T>(url, options)
}
