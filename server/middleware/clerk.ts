import { clerkMiddleware, createRouteMatcher } from '@clerk/nuxt/server'

// Every page except the landing page (`/`) requires authentication. Matching the
// page prefixes positively (rather than "everything but /") keeps static assets
// and `/_nuxt/*` requests out of the auth check.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/orgs(.*)',
  '/debug(.*)'
])

export default clerkMiddleware((event) => {
  if (isProtectedRoute(event) && !event.context.auth().userId) {
    return sendRedirect(event, '/')
  }
})
