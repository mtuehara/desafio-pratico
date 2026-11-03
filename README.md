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
5. Use **Atualizar lista** to retrieve changes made from another tab.

Forms preserve input after errors and prevent duplicate submissions while pending. Successful creation and editing return to the list with feedback. A missing task shows a not-found page with a link back to the list.

## Test coverage

The suite contains 65 tests across 10 files. It uses Vitest with a Node.js environment for backend tests and jsdom with Testing Library for component tests.

| Area | Verified behavior |
| --- | --- |
| Input schemas | Required trimmed title, optional description, server-owned fields, UUIDs, page-size and cursor validation |
| In-memory store | Unique IDs, timestamps, stable ordering, defensive copies, updates, deletion and instance isolation |
| tRPC procedures | Complete CRUD lifecycle, rejected writes, meaningful errors and stable cursor pagination after concurrent list changes |
| HTTP adapter | Typed client communication, readable validation errors and unknown procedures |
| Task list | Initial data, refresh, empty state, deletion feedback, duplicate request prevention, incremental loading and retry |
| Form and mutations | Controlled fields, normalization, optional description, preserved input, cache reset and success navigation |
| Server pages | Tasks in the initial HTML, preloaded edit data and missing-task handling |

Component tests mock API responses while exercising the actual form and TanStack Query state. Backend tests use fresh stores rather than shared fixtures. HTTP adapter tests use real tRPC client requests against the Fetch adapter without opening network ports.

## Architecture

- `src/app`: pages, document layout, styles, loading and error boundaries, and the tRPC HTTP adapter.
- `src/app/(home)`: server-loaded home page and its loading boundary. The route group does not change the `/` URL; scoping loading here lets missing edit pages return HTTP 404 before streaming starts.
- `src/app/tasks`: creation and server-loaded editing pages.
- `src/components/task-list.tsx`: interactive task list, query refresh and deletion.
- `src/components/task-form.tsx`: reusable controlled form with validation and submission feedback.
- `src/components/create-task.tsx`: creation mutation, cache reset and navigation after success.
- `src/components/edit-task.tsx`: update mutation, prefilled form and navigation after success.
- `src/server/trpc.ts`: tRPC initialization and error formatting.
- `src/server/router.ts`: root router and exported `AppRouter` type.
- `src/server/routers/tasks.ts`: validated task procedures.
- `src/server/task-store.ts`: process-local Map and isolated store factory.
- `src/shared/task.ts`: input schemas and inferred types.
- `src/trpc/client.tsx`: typed HTTP client and TanStack Query providers.

Tests live next to their modules as `.test.ts` or `.test.tsx` files. The server page invokes tRPC through a direct caller, avoiding a loopback HTTP request. Browser requests use `/api/trpc`. Client components import only the router type, keeping server implementation out of the browser bundle.

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
| `status` | query | None |
| `tasks.list` | query | None |
| `tasks.listPage` | query | `{ limit?, cursor?: { createdAt, id } }` |
| `tasks.getById` | query | `{ id }` |
| `tasks.create` | mutation | `{ title, description? }` |
| `tasks.update` | mutation | `{ id, title, description? }` |
| `tasks.delete` | mutation | `{ id }` |

Updates replace editable fields; omitting the description clears it. Invalid inputs return `BAD_REQUEST`. Reading, updating or deleting an unknown UUID returns `NOT_FOUND`. Internal errors use a generic response message.

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
