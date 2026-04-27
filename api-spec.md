# LeafyTasks Frontend — API Requests Reference

All requests go through a shared client (`app/composables/useApi.ts`) that:
- Sends `Authorization: Bearer <clerk-jwt>` on every call (Clerk JWT).
- Uses `INTERNAL_API_BASE` env var during SSR (server-to-server) and `PUBLIC_API_BASE` during client-side calls.
- Expects error responses to contain a JSON body with a `message` field (used to render toasts). Status codes drive Nuxt's error page for 404s on primary entities.

---

## Project detail page (`/projects/{url_name}`)

### 1. `GET /api/projects/{url_name}`
- **Purpose**: Primary project metadata. Blocking — if this 404s or errors, the page shows the error page.
- **Response** (`Project`):
  ```ts
  {
    url_name: string
    title: string
    description: string
    status: 'active' | 'on-hold' | 'completed' | 'archived'
    owner: { name: string, avatar: string }    // avatar is a URL
    start_date: string                         // ISO date
    end_date: string                           // ISO date
    tasks_total: number
    tasks_done: number
    created_at: string                         // ISO datetime
    updated_at: string                         // ISO datetime
  }
  ```

### 2. `GET /api/projects/{url_name}/status?recursive={bool}`
- **Purpose**: Activity/status timeline for the project. `recursive` is driven by a UI toggle ("Include subtasks"); when true, the log aggregates updates from all descendant tasks.
- **Response** (`StatusUpdate[]`):
  ```ts
  [{
    status: TaskStatus | ProjectStatus   // 'pending'|'wip'|'blocked'|'done' OR 'active'|'on-hold'|'completed'|'archived'
    description: string
    author: string
    created_at?: string                   // ISO datetime
  }]
  ```

### 3. `GET /api/projects/{url_name}/tasks`
- **Purpose**: Immediate child tasks of the project (root-level tasks). Rendered in the "Subtasks" tab.
- **Response** (`TaskSummary[]`): see shape below.

### 4. `GET /api/projects/{url_name}/tasks?leafs=true`
- **Purpose**: All leaf tasks anywhere in the project tree (tasks with no further subtasks). Rendered in the "Leaf Tasks" tab.
- **Response** (`TaskSummary[]`): same shape as above.

---

## Task detail page (`/projects/{url_name}/tasks/{id}`)

### 5. `GET /api/projects/{url_name}/tasks/{id}`
- **Purpose**: Primary task metadata. Blocking — 404s send user to error page.
- **Response** (`Task`):
  ```ts
  {
    id: string
    title: string
    description: string
    status: 'pending' | 'wip' | 'blocked' | 'done'
    priority: 'low' | 'medium' | 'high' | 'critical'
    assignee: { name: string, avatar: string }
    assignee_id: string
    due_at: string                        // ISO date
    created_at: string                    // ISO datetime
    updated_at: string                    // ISO datetime
    completed_at: string                  // ISO datetime (empty string if not done)
    dependencies: [{
      id: string
      title: string
      status: 'pending' | 'wip' | 'blocked' | 'done'
    }]
  }
  ```

### 6. `GET /api/projects/{url_name}/tasks/{id}/status?recursive={bool}`
- **Purpose**: Status timeline for this task. `recursive=true` includes updates from subtasks.
- **Response** (`StatusUpdate[]`): same shape as project status.

### 7. `GET /api/projects/{url_name}/tasks/{id}/childs`
- **Purpose**: Immediate child tasks of this task. Rendered in "Subtasks" tab.
- **Response** (`TaskSummary[]`): see shape below.

### 8. `GET /api/projects/{url_name}/tasks/{id}/leafs`
- **Purpose**: All leaf descendants of this task. Rendered in "Leaf Tasks" tab.
- **Response** (`TaskSummary[]`): same shape as above.

### 9. `GET /api/projects/{url_name}/tasks/{id}/dependable?q={search}`
- **Purpose**: Candidate tasks that can be added as dependencies of this task. Frontend sends a new
               request on every keystroke in the "Add dependency..." input (no debounce). Should
               exclude tasks that would create cycles and tasks already in the dependencies list.
- **Query param**: `q` (string, may be empty)
- **Response** (`DependableCandidate[]`):
  ```ts
  [{
    id: string
    title: string
  }]
  ```

---

## Mutation (existing, not yet refactored through the new API client)

### 10. `POST /api/projects/{url_name}/tasks/new`
- **Purpose**: Create a new task. Used inside the `LeafyTasksChildTasks` component's inline creation form.
- **Request body**:
  ```ts
  {
    title: string
    description: string
    parent_id: string | null              // set when creating a subtask
    dependencies: string[]                // task IDs; set when creating a follow-up task
  }
  ```
- **Response** (minimum fields consumed by frontend):
  ```ts
  {
    id: string
    taskTitle?: string
    description?: string
  }
  ```

---

## Shared types (`TaskSummary`)

Used by endpoints #3, #4, #7, #8:

```ts
{
  id: string
  title: string
  description: string
  status: 'pending' | 'wip' | 'blocked' | 'done' | ''
  priority: 'low' | 'medium' | 'high' | 'critical' | ''
  assignee_id: string
  due_at: string           // ISO date, may be empty
  updated_at: string       // ISO datetime
  completed_at: string     // ISO datetime, empty if not done
}
```

---

## Cross-cutting backend requirements

- **Auth**: every endpoint validates the `Authorization: Bearer <jwt>` header via Clerk. Return `401` if missing/invalid.
- **Scoping**: all reads should enforce that the authenticated user has access to `{url_name}` and `{id}`. Return `404` (not `403`) for tasks/projects the user cannot see, to avoid leaking existence.
- **Error body shape**: return JSON `{ "message": "Human-readable explanation" }` on 4xx/5xx — the frontend reads `response._data.message` to populate the toast description.
- **Recursive parameter**: accepted on the two `/status` endpoints; boolean. Default `false`. When `true`, union the status log of the entity with all descendants, ordered by `created_at` desc.
- **Leaf detection**: a "leaf" task has zero children (no other task has it as `parent_id`). It may still have follow-up dependencies — those don't affect leaf-ness.
- **SSR vs client hosts**: backend doesn't need to distinguish; frontend routes requests internally (SSR → internal host, client → public host). Both hit the same API.
- **CORS**: the public host must allow the frontend's origin, methods `GET, POST, PATCH, DELETE`, and the `Authorization` header.

---

## Backend specifications

 - All endpoints should receive a user identifier pre extracted from the Clerk JWT.
