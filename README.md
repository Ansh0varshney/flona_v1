# Flona

Real-time campus communication for IIT Kharagpur with chat, events, and comments.

## Current Features

- Google OAuth sign-in with allowed email domain guard
- Persistent user profiles with generated flona names
- Global real-time chat (Ably) with typing indicators
- Message persistence in PostgreSQL (last 100 loaded on page open)
- Events map (Leaflet) with campus bounds validation
- Create events by clicking the map and setting time range
- Event details modal with threaded comments

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Auth**: NextAuth + Google OAuth
- **Database**: PostgreSQL + Prisma
- **Real-time**: Ably
- **Maps**: Leaflet + OpenStreetMap tiles
- **Styling**: Tailwind CSS

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (see below).
3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Open http://localhost:3000 in your browser.

## Environment Variables

Create a `.env.local` file with:

```bash
DATABASE_URL=
DIRECT_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
ABLY_API_KEY=
ALLOWED_EMAIL_DOMAIN=kgpian.iitkgp.ac.in
```

Notes:
- `ALLOWED_EMAIL_DOMAIN` defaults to `gmail.com` if not set.
- `DIRECT_URL` is used by Prisma for migrations.

## Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Lint codebase

## Project Structure

```
flona/
├── app/                 # App Router pages and API routes
├── app/components/      # UI components (chat, events)
├── lib/                 # Auth, DB, and shared helpers
├── prisma/              # Prisma schema and migrations
└── public/              # Static assets
```
