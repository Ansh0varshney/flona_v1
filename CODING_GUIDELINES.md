# Coding Guidelines

This document captures how we write code in this repository.

## General Conventions

- Use TypeScript for all app and server code.
- Prefer functional React components and hooks.
- Keep components focused; split when a file grows too large or mixes concerns.
- Name handlers with a `handle` prefix (for example: `handleSubmit`, `handleClick`).
- Avoid heavy inline logic in JSX. Compute values above the return when possible.
- Use explicit `try/catch` blocks for async work that can fail.
- Keep logging minimal and actionable; remove noisy logs before shipping.

## Styling

- Use Tailwind CSS utility classes.
- Favor small, composable classes instead of large bespoke CSS blocks.
- Keep color and spacing tokens consistent across related components.

## API Routes

- Use Next.js App Router route handlers under `app/api/.../route.ts`.
- Validate input early and return a clear 4xx error when invalid.
- Use Prisma for database access; do not construct raw SQL.
- Keep handlers small: validate, query/mutate, then return a response.

## Auth and Sessions

- Authentication is handled by NextAuth (Google OAuth).
- Enforce domain restriction using `ALLOWED_EMAIL_DOMAIN`.
- Use `getServerSession(authOptions)` in API routes that require auth.

## Data Fetching

- Use `fetch` with `cache: 'no-store'` for live data (events, comments, messages).
- Keep client-side state minimal; prefer reloading after mutations.

## Error Handling

- Return JSON errors from API routes with a single `error` string.
- In the UI, show user-friendly errors and avoid leaking server details.

## Testing

- There are no automated tests yet. Keep functions small to ease future testing.

# Database

The database uses PostgreSQL via Prisma.

## Models (Prisma)

- `User`
  - `id` (uuid, primary key)
  - `email` (unique)
  - `name`, `image`
  - `flona_name` (unique display name)
  - Relations: `events`, `comments`, `chatMessages`

- `Event`
  - `id` (autoincrement)
  - `title`, `description`
  - `lat`, `lng`, `location_name`
  - `start_time`, `end_time`, `created_at`
  - `created_by` (User relation)

- `Comment`
  - `id` (autoincrement)
  - `event_id` (Event relation)
  - `user_id` (User relation)
  - `content`, `created_at`

- `ChatMessage`
  - `id` (uuid)
  - `user_id` (User relation)
  - `user_name`, `user_email`
  - `text`, `created_at`

## Notes

- Chat messages are persisted; the UI loads the last 100 messages.
- Events are filtered to only show those that have not ended yet.
- Comments are tied to events and ordered by creation time.
