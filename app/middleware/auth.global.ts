// Client-side auth guard. The server middleware (server/middleware/clerk.ts)
// only runs on full page loads; because this app is a SPA (`ssr: false`), it
// does not run during in-app navigation. This guards every route except the
// landing page (`/`) so signed-out users can't reach a protected page by
// clicking a link (e.g. the always-present "LeafyTasks" brand link).
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/') return

  const { isLoaded, isSignedIn } = useAuth()

  // Wait until Clerk has resolved auth state before redirecting, so we never
  // bounce a signed-in user mid-load. The server middleware already covers the
  // not-yet-loaded direct-hit case.
  if (isLoaded.value && !isSignedIn.value) {
    return navigateTo('/')
  }
})
