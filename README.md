# Task manager

A task manager built with Next.js 15, TypeScript and tRPC. Source code, API fields, tests and comments use English. User-facing content uses Brazilian Portuguese.

## Features

- In-memory CRUD API with Zod validation and readable errors.
- Dynamic server-rendered task list, including tasks in the initial HTML.
- Deletion with loading, success and failure feedback.
- Task creation at `/tasks/new`, with shared input validation, pending state and error feedback.
- Task editing at `/tasks/[id]/edit`, reusing the form and handling missing tasks.
- Infinite scroll with 10 tasks per page, an accessible manual loading button, and retry after failure.
- Unit tests for schemas, storage and procedures; component tests for the list; integration tests for HTTP communication and server rendering.

All required CRUD pages are implemented.

## Setup

Use Node.js 22.12+, 24.x or 26+ and npm, matching the Vitest engine requirements. Verified with Node.js 24.13.0 and npm 11.6.2.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Development uses Turbopack.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

Run `build` before `start`. Use `npm run test:watch` while developing. The lockfile records exact dependency versions.

## Using the application

1. Open the home page and select **Nova tarefa**.
2. Enter a title and an optional description, then select **Criar tarefa**.
3. Select **Editar** on a task to update it, or **Excluir** to remove it.
4. After adding more than 10 tasks, scroll down or select **Carregar mais** to load another page.

Forms preserve input after errors and prevent duplicate submissions while pending. Successful creation and editing return to the list with feedback. A missing task shows a not-found page with a link back to the list.

## Test coverage

The suite contains 74 tests across 10 files. It uses Vitest with a Node.js environment for backend tests and jsdom with Testing Library for component tests.

| Area | Verified behavior |
| --- | --- |
| Input schemas | Required trimmed title, optional description, server-owned fields, UUIDs, page-size and cursor validation |
| In-memory store | Unique IDs, timestamps, stable ordering, defensive copies, updates, deletion and instance isolation |
| tRPC procedures | Complete CRUD lifecycle, rejected writes, meaningful errors and stable cursor pagination after concurrent list changes |
| HTTP adapter | Typed client communication, readable validation errors and unknown procedures |
| Task list | Initial data, reload after deletion, empty state, deletion feedback, duplicate request prevention, incremental loading and retry |
| Form and mutations | Controlled fields, normalization, optional description, preserved input, cache reset and success navigation |
| Server pages | Tasks in the initial HTML, preloaded edit data and missing-task handling |

Component tests mock API responses while exercising the actual form and TanStack Query state. Backend tests use fresh stores rather than shared fixtures. HTTP adapter tests use real tRPC client requests against the Fetch adapter without opening network ports.

## Architecture

The application uses a feature-based structure. Routes compose the task feature; task-specific code stays together; tRPC infrastructure is independent of the feature's UI.

```text
src/
  app/
    api/trpc/[trpc]/route.ts   # HTTP adapter
    tasks/
      new/page.tsx            # Creation route
      [id]/edit/
        page.tsx              # Server-loaded editing route
        page.test.tsx
    page.tsx                  # Server-loaded task list
    page.test.tsx
    layout.tsx                # Shared HTML and metadata
    providers.tsx             # Application-wide client providers
    error.tsx                 # Render error boundary
    not-found.tsx             # Missing page or task
    globals.css
  features/
    tasks/
      components/
        task-list.tsx         # Pagination and deletion
        task-form.tsx         # Controlled fields and validation
        create-task.tsx       # Creation mutation and navigation
        edit-task.tsx         # Update mutation and navigation
        *.test.tsx
      schemas/
        task.schema.ts        # Zod schemas and inferred task types
        task.schema.test.ts
      server/
        task-router.ts        # Validated task procedures
        task-router.test.ts
        task-store.ts         # In-memory storage and isolated factory
        task-store.test.ts
  lib/
    trpc/client.ts            # Typed React context and hooks
  server/
    api/
      trpc.ts                 # tRPC initialization and error formatting
      root.ts                 # Application router composition
      root.test.ts            # Caller and HTTP integration tests
```

### Dependency boundaries

- `app` defines URLs and composes feature components with server-side data. Client providers live at this composition boundary.
- `features/tasks/components` handles task interactions and uses the typed tRPC client for runtime server access.
- `features/tasks/schemas` defines the shared contract. Types are inferred from Zod rather than duplicated in a separate model layer.
- `features/tasks/server` owns task procedures and storage. Both modules use `server-only` to prevent accidental browser imports.
- `server/api` initializes tRPC and registers feature routers. It does not contain task-specific storage or UI.
- `lib/trpc` exposes the typed client context. Its server router import is type-only and is erased from the browser bundle.

ESLint restricts aliased server implementation imports in client modules and prevents schemas from importing UI, transport or server implementation. Unit tests mock the `server-only` marker while exercising the real backend modules in Node.js.

Tests live next to their modules. Imports point directly to the required module, keeping client/server boundaries visible. There are no empty generic component folders or repository/service interfaces for the single in-memory implementation.

The server page invokes tRPC through a direct caller, avoiding a loopback HTTP request. Browser requests use `/api/trpc`. The home page is directly under `app/page.tsx`; loading feedback is managed by query, mutation and form navigation state. The editing route can return HTTP 404 before any loading boundary starts streaming.

Square-bracket folders are reserved for the Next.js dynamic route conventions: `[id]` receives the task identifier and `[trpc]` receives the procedure path. There are no optional route groups.

Deletion removes a task from the cache only after success and then invalidates the query. Failures preserve existing data. Dates use an explicit `America/Sao_Paulo` time zone to keep server and browser output consistent.

The server renders the first page. `useInfiniteQuery` appends subsequent pages, and an `IntersectionObserver` requests more tasks near the viewport. The cursor contains the creation timestamp and ID, so deleting the cursor task does not break pagination. Failed requests preserve loaded pages and require a manual retry. Tasks inserted ahead of the current cursor appear on refresh rather than shifting existing page positions.

The project uses plain CSS and system fonts. TypeScript runs in strict mode. The Next.js configuration pins the project root to prevent external lockfiles from affecting build tracing or Turbopack.

## API contract

| Field | Type | Rule |
| --- | --- | --- |
| `id` | `string` | Server-generated UUID; immutable |
| `title` | `string` | Required after trimming whitespace |
| `description` | `string`, optional | Empty values are normalized to absence |
| `createdAt` | `number` | Server-generated Unix timestamp in milliseconds; immutable |

| Procedure | Type | Input |
| --- | --- | --- |
| `tasks.list` | query | None |
| `tasks.listPage` | query | `{ limit?, cursor?: { createdAt, id } }` |
| `tasks.getById` | query | `{ id }` |
| `tasks.create` | mutation | `{ title, description? }` |
| `tasks.update` | mutation | `{ id, title, description? }` |
| `tasks.delete` | mutation | `{ id }` |

Updates replace editable fields; omitting the description clears it. Invalid inputs return `BAD_REQUEST`. Reading, updating or deleting an unknown UUID returns `NOT_FOUND`. Duplicate titles return `CONFLICT` (HTTP 409) on creation and editing, comparing trimmed text without case sensitivity. Updating a task may keep its own title. Failed writes preserve existing data. Internal errors use a generic response message.

Page size defaults to 10 and accepts integers from 1 to 50. `listPage` returns `{ items, nextCursor? }`; an absent cursor means there are no more results.

## Storage limitations

Tasks live in a process-local Map and disappear on restart. Run the demo in one Node.js process: separate instances do not share data. A `globalThis` reference lets server pages and API handlers share the same store within that process, including during module reloads.

Store reads return copies. Tasks are ordered by descending creation time, with ID as a stable tie-breaker. Tests create independent stores. There is no database or authentication; the list is shared.

## Dependency notes

The base uses Next.js 15.5.29 and React/React DOM 19.3.1. A PostCSS 8.5.32 override replaces the old version pinned by Next.js 15 and addresses the reported [source map file-read vulnerability](https://github.com/advisories/GHSA-6g55-p6wh-862q).

The latest installation reported 14 moderate development-tool alerts originating from [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249). ESLint 9 is outside its support window but is the latest major accepted by the selected Next.js 15 lint configuration. No incompatible transitive major upgrade was forced.

## References

- [Next.js 15](https://nextjs.org/docs/15)
- [tRPC TanStack Query integration](https://trpc.io/docs/client/tanstack-react-query/setup)
- [Vitest](https://vitest.dev/guide/)
