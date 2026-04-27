import { clerkMiddleware, createRouteMatcher } from '@clerk/nuxt/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
  '/users(.*)'
])

export default clerkMiddleware((event) => {
  if (isProtectedRoute(event) && !event.context.auth().userId) {
    return sendRedirect(event, '/')
  }
})
