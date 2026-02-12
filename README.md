# Flona - Phase 1

A real-time campus communication platform for IIT Kharagpur.

## Phase-1 Scope

- ✅ Google OAuth authentication (@kgpian.iitkgp.ac.in only)
- ✅ PostgreSQL + Prisma (User model)
- ✅ Ably global chatroom (ephemeral messages)
- ✅ Next.js App Router structure

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Auth**: NextAuth (Google OAuth)
- **Database**: PostgreSQL + Prisma
- **Real-time**: Ably
- **Hosting**: Vercel

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your credentials
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
flona/
├── app/                 # Next.js App Router
├── lib/                 # Shared logic
├── prisma/              # Database schema
└── public/              # Static assets
```

## Phase-1 Features

- Global real-time chatroom
- Email domain restriction
- User authentication
- Ephemeral messaging (not stored in DB)

## Non-Goals (Phase-2)

- ❌ Events
- ❌ Map view
- ❌ Comments
- ❌ Message persistence
- ❌ Notifications
