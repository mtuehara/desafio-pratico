# Task manager

A task manager built with Next.js 15, TypeScript and tRPC. Source code, API fields, tests and comments use English. User-facing content uses Brazilian Portuguese.

## Features

- In-memory CRUD API with Zod validation and readable errors.
- Dynamic server-rendered task list, including tasks in the initial HTML.
- Deletion with loading, success and failure feedback.
- Unit tests for schemas, storage and procedures; component tests for the list; integration tests for HTTP communication and server rendering.

Creation and editing pages are being implemented next.

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

## Architecture

- `src/app`: pages, document layout, styles, loading and error boundaries, and the tRPC HTTP adapter.
- `src/components/task-list.tsx`: interactive task list, query refresh and deletion.
- `src/server/trpc.ts`: tRPC initialization and error formatting.
- `src/server/router.ts`: root router and exported `AppRouter` type.
- `src/server/routers/tasks.ts`: validated task procedures.
- `src/server/task-store.ts`: process-local Map and isolated store factory.
- `src/shared/task.ts`: input schemas and inferred types.
- `src/trpc/client.tsx`: typed HTTP client and TanStack Query providers.

Tests live next to their modules as `.test.ts` or `.test.tsx` files. The server page invokes tRPC through a direct caller, avoiding a loopback HTTP request. Browser requests use `/api/trpc`. Client components import only the router type, keeping server implementation out of the browser bundle.

Deletion removes a task from the cache only after success and then invalidates the query. Failures preserve existing data. Dates use an explicit `America/Sao_Paulo` time zone to keep server and browser output consistent.

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
| `tasks.getById` | query | `{ id }` |
| `tasks.create` | mutation | `{ title, description? }` |
| `tasks.update` | mutation | `{ id, title, description? }` |
| `tasks.delete` | mutation | `{ id }` |

Updates replace editable fields; omitting the description clears it. Invalid inputs return `BAD_REQUEST`. Reading, updating or deleting an unknown UUID returns `NOT_FOUND`. Internal errors use a generic response message.

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
