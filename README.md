# Cow Farm Simulator Remastered 🐄

Remaking my first big project (2018) into something cool! A cozy cow farming game built with React and Supabase for cloud saves.

## References

- Original Scratch ver: https://scratch.mit.edu/projects/225887048/
- Openprocessing rewrite (abandoned): https://openprocessing.org/sketch/639290

---

## Prerequisites

- **Node.js** v18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** v9+
- **Docker** (required for local Supabase)
- **Supabase CLI** (installed automatically as dev dependency)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Frontend (No Backend)

The game works offline without Supabase—cloud saves are optional.

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Full Setup (with Cloud Saves)

### Option A: Local Supabase (Recommended for Development)

#### 1. Start Docker

Ensure Docker Desktop (or Docker daemon) is running.

#### 2. Start Local Supabase

```bash
cd supabase
npx supabase start
```

This spins up a local Supabase stack with:
- **API**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323 (database GUI)
- **Database**: localhost:54322

#### 3. Apply Database Migrations

```bash
npm run db:push
```

#### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# .env.local
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=<your-local-anon-key>
```

Get your local anon key by running:

```bash
cd supabase
npx supabase status
```

Look for `anon key` in the output.

#### 5. Start the Frontend

```bash
npm start
```

---

### Option B: Remote Supabase (Production)

#### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings → API

#### 2. Link to Your Project

```bash
npm run supabase:link
```

Enter your project reference ID when prompted (found in project settings).

#### 3. Push Database Schema

```bash
npm run db:push
```

#### 4. Configure Environment Variables

Create a `.env.local` file:

```bash
# .env.local
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

#### 5. Start the Frontend

```bash
npm start
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests in watch mode |
| `npm run db:push` | Push migrations to database |
| `npm run db:reset` | Reset database (⚠️ deletes data) |
| `npm run db:diff` | Generate migration from schema changes |
| `npm run db:migrate` | Create a new migration file |
| `npm run supabase:link` | Link to remote Supabase project |

---

## Project Structure

```
├── public/              # Static assets (images, sounds)
├── src/
│   ├── components/      # React components
│   ├── config/          # Game configuration
│   ├── engine/          # Game logic, state, reducers
│   ├── pages/           # Page components (pasture, crafting)
│   └── save/            # Supabase client & sync services
├── supabase/
│   ├── config.toml      # Local Supabase configuration
│   └── migrations/      # Database migrations
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_SUPABASE_URL` | No | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

> **Note**: Cloud saves are disabled if these are not set. The game works fully offline.

---

## Stopping Local Supabase

```bash
cd supabase
npx supabase stop
```

To stop and reset all data:

```bash
npx supabase stop --no-backup
```

---

## Troubleshooting

### "Supabase not configured" warning

This is normal if you haven't set up cloud saves. The game works without it.

### Docker errors when starting Supabase

1. Ensure Docker is running
2. Try `docker system prune` to free up resources
3. Restart Docker Desktop

### Database connection issues

Check that local Supabase is running:

```bash
cd supabase
npx supabase status
```

---

## Tech Stack

- **Frontend**: React 18, TypeScript, CSS Modules
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Build**: Create React App
- **Testing**: Jest + React Testing Library
