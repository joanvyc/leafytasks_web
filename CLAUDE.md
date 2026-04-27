# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking (via nuxt typecheck)
```

CI runs `lint` and `typecheck` on every push — both must pass.

## Architecture

LeafyTasks is a task management app built with **Nuxt 4** and **Nuxt UI v4**. It uses the Nuxt 4 `app/` directory convention (all source lives under `app/`).

**Key modules:**
- `@nuxt/ui` — component library (all `U*` components come from here)
- `@clerk/nuxt` — authentication; `useAuth()`, `<Show when="signed-in">`, `<UserButton />`, `<SignInButton />` are Clerk primitives
- `@nuxtjs/mdc` — Markdown rendering
- Tailwind CSS v4

**Routing:**
| Path | File |
|------|------|
| `/` | `app/pages/index.vue` — landing page |
| `/dashboard` | `app/pages/dashboard.vue` — project list |
| `/projects/[url_name]` | `app/pages/projects/[url_name].vue` — project detail + status log |
| `/projects/[url_name]/tasks/[id]` | `app/pages/projects/[url_name]/tasks/[id].vue` — task detail |

The home route (`/`) is prerendered; everything else is SSR.

**API access:**
- `app/composables/useApi.ts` exports `useApiFetch()`, which wraps Nuxt's `$fetch` and injects the Clerk Bearer token.
- Server-side requests use `runtimeConfig.internalApiBase`; client-side uses `runtimeConfig.public.apiBase`.
- Both default to `https://api.leafytasks.com` unless overridden by `INTERNAL_API_BASE` / `PUBLIC_API_BASE` env vars.
- Most `useFetch` calls in pages/components are currently stubbed with hardcoded reactive data — the commented-out fetch calls show the intended API shape.

**Task model:**
Tasks have `id`, `title`, `description`, `status`, `priority`, `assignee_id`, `due_at`, `updated_at`, `completed_at`. Status values are `done | wip | pending | blocked`, mapped to Nuxt UI colors `success | info | warning | error` by the `LTStatus` component.

Tasks form a tree: a task can have subtasks (parent/child) and follow-up dependencies. `LeafyTasksChildTasks` handles inline task creation with both relationship types.

**Component naming:**
- `LT*` prefix — small, reusable primitives (e.g. `LTStatus`)
- `LeafyTask*` prefix — domain-level components (e.g. `LeafyTaskProjectSummary`, `LeafyTasksChildTasks`)

**ESLint style:** no trailing commas, 1tbs brace style (enforced via `@nuxt/eslint` stylistic config).
