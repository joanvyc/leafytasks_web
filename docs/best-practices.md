# LeafyTasks — Best Practices

Conventions for working in this codebase. Read this before adding new pages, components, or API calls.

## API access

**Always use `useApiFetch` or `$apiFetch`. Never call `useFetch` or `$fetch` directly against the backend API.**

Both wrappers automatically:

- Inject `Authorization: Bearer <clerk-token>` from the current Clerk session
- Use the correct base URL (`internalApiBase` on the server, `public.apiBase` on the client)
- Surface API errors as toast notifications on the client

They share a single `ofetch` instance defined in `app/plugins/api.ts` and exposed as `$api` on the Nuxt app. The composables in `app/composables/useApi.ts` are thin wrappers around it.

### Which one to use

| Situation | Use | Why |
|---|---|---|
| Loading data in a page or component `<script setup>` | `useApiFetch` | SSR-aware, returns reactive `data`/`error`, dedupes |
| Mutations (POST/PATCH/DELETE) inside event handlers | `$apiFetch` | One-shot, returns a Promise, throws on error |
| Refetching after a mutation | `refresh()` from the original `useApiFetch` | Reuses the cache key |

### Examples

**Loading data:**

```ts
const { data: project, error } = await useApiFetch<Project>(
  () => `/api/projects/${route.params.url_name}`
)
```

Pass a function (not a string) when the URL depends on reactive state — the request re-runs when the dependency changes.

**Mutating data:**

```ts
async function createTask(payload: NewTask) {
  try {
    const created = await $apiFetch<Task>('/api/tasks/new', {
      method: 'POST',
      body: payload
    })
    await refreshTasks()
    return created
  } catch (err) {
    // The plugin already toasts the error; only handle UI-specific fallout here.
    return null
  }
}
```

**Why not just override `$fetch` and `useFetch` globally?**
Nuxt internals (Nitro renderer, devtools, modules) call `$fetch` against your own server routes — overriding it globally would silently break them. The Nuxt-recommended pattern is a custom `ofetch` instance + a thin composable, which is what this project uses.

### Where the auth token comes from

`app/plugins/api.ts` calls `useAuth().getToken.value()` (Clerk's Vue composable) inside the `onRequest` hook. On the client this reads the live session; on the server it reads the request-scoped auth set up by `server/middleware/clerk.ts`. If there's no token, the header is omitted (so anonymous endpoints still work).

### Adding a new API call — checklist

1. Use `useApiFetch` or `$apiFetch` — never bare `useFetch`/`$fetch`.
2. Type the response: `useApiFetch<Project>(...)`. Add the type to `app/types/api.ts` if it's new.
3. For data loading, prefer `() => '/api/...'` over `'/api/...'` so the URL stays reactive.
4. Don't add manual auth headers — the plugin handles that.
5. Don't add manual error toasts — the plugin handles that. Only catch errors when you need UI-specific recovery.

## Route protection

Server middleware at `server/middleware/clerk.ts` gates `/dashboard(.*)`, `/projects(.*)`, and `/users(.*)` and redirects unauthenticated requests to `/`. To add a new protected section, add its prefix to the `createRouteMatcher` list there. The landing page (`/`) and `/login` are public.

## Routing (Nuxt 4 `app/` directory)

All source lives under `app/`. Pages map to files in `app/pages/`:

| Path | File |
|---|---|
| `/` | `pages/index.vue` (prerendered) |
| `/dashboard` | `pages/dashboard.vue` |
| `/projects/[url_name]` | `pages/projects/[url_name]/index.vue` |
| `/projects/[url_name]/tasks/[id]` | `pages/projects/[url_name]/tasks/[id].vue` |

**Gotcha:** never use `[param].vue` and `[param]/` side-by-side at the same level — Nuxt picks one and silently ignores the other. Always use `[param]/index.vue` when you also have nested children.

## Components

- `LT*` — small, reusable primitives (e.g. `LTStatus`).
- `LeafyTask*` — domain-level building blocks (e.g. `LeafyTaskProjectSummary`, `LeafyTasksChildTasks`).
- All `U*` components come from Nuxt UI v4 — don't hand-roll equivalents.

## Status / color mapping

Task status (`done | wip | pending | blocked`) maps to Nuxt UI colors via `LTStatus`:

| Status | Color |
|---|---|
| `done` | `success` |
| `wip` | `info` |
| `pending` | `warning` |
| `blocked` | `error` |

Don't reimplement this mapping inline — render a `<LTStatus :status="..." />` instead.

## Code style

- ESLint stylistic config: no trailing commas, 1tbs brace style. Run `pnpm lint --fix` before committing.
- TypeScript: prefer typed responses on every API call. Shared shapes go in `app/types/api.ts`.
- No comments unless the *why* is non-obvious.

## CI

`pnpm lint` and `pnpm typecheck` run on every push (`.github/workflows/ci.yml`). Both must pass.

## Deployment (Railway)

- `pnpm build` produces `.output/`; `pnpm start` runs `node .output/server/index.mjs`.
- Required env vars in Railway:
  - `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NUXT_CLERK_SECRET_KEY` — Clerk
  - `INTERNAL_API_BASE`, `PUBLIC_API_BASE` — only if not using the `api.leafytasks.com` defaults
- `.env` is gitignored. Never commit secrets.
