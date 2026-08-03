# TaskFlow

A full-stack, real-time collaborative kanban board — built to get hands-on with how tools like Trello and Linear handle live multi-user sync, drag-and-drop state, and conflict resolution under the hood.

**Demo login:** `demo@taskflow.dev` / `password123`

---

## What it does

- Create boards, invite teammates by email, and organize work into lists and cards — the familiar Trello-style workflow.
- Drag cards between lists and reorder them with smooth, optimistic updates that persist instantly.
- See changes from other collaborators appear live, with no page refresh — card moves, new lists, edits, all sync over WebSockets.
- Open any card to set a description, due date, and assignee — real task-tracking fields, not just a title.
- Every board has a live activity feed: who moved what, when.

## Tech stack

**Frontend:** React (Vite) · TypeScript · Tailwind CSS · `@dnd-kit` for drag-and-drop · `zustand` for state · `socket.io-client` · `axios`

**Backend:** Node.js · Express · TypeScript · `socket.io` · `jsonwebtoken` + `bcrypt` for auth · `zod` for request validation · Prisma ORM

**Database:** PostgreSQL

**Infra:** Docker (multi-stage builds) + Docker Compose for one-command local dev · GitHub Actions CI

---

## Architecture

```
┌─────────────┐        REST (JSON)        ┌──────────────┐
│   React     │ ────────────────────────▶ │   Express    │
│  (Vite SPA) │ ◀──────────────────────── │   API server │
└─────────────┘                           └──────┬───────┘
       │                                          │
       │         WebSocket (Socket.io)            │ Prisma
       └─────────────────────────────────────────▶│
                                                   ▼
                                          ┌──────────────┐
                                          │  PostgreSQL  │
                                          └──────────────┘
```

- The frontend talks to the backend two ways: **REST** for all data mutations (create/update/delete), and a **WebSocket connection** (one room per board) for receiving live updates from other clients.
- Every mutating REST request also broadcasts an event to that board's socket room, so every other connected client updates without polling.
- Each browser tab tags its own requests with a random client ID, so a tab ignores the "echo" of its own change coming back over the socket — it already applied that change optimistically.

## Data model

```
User ─┬─< BoardMember >─┬─ Board ─┬─< List >─┬─< Card
      │                 │         │          └── assigneeId → User
      └── owns Boards ──┘         └── ActivityLog
```

- `User` — email/password auth, bcrypt-hashed.
- `Board` — has one owner, many members (simple flat membership, no per-member roles).
- `List` — ordered columns on a board.
- `Card` — title, description, due date, assignee, ordered within its list.
- `ActivityLog` — an append-only feed of actions per board.

## Design decisions

**Position-based ordering, not array indices.**
Lists and cards store a floating-point `position` value instead of an integer index. Moving a card between two others just means computing the midpoint of their positions — no need to rewrite every row on every drag, which would get slow fast on a board with a lot of cards. The catch: after enough reorders piled up in the same spot, position values could eventually run into float precision limits. The real fix is a periodic rebalancing pass that spreads positions back out — I haven't built that yet, but it's on my radar and a natural next step if this ever needed to handle heavier use.

**Real-time conflict handling: last-write-wins, corrected via broadcast.**
If two people drag the same card at almost the same moment, whichever write lands last in the database wins — but the server immediately broadcasts the corrected state to everyone connected, so nobody's screen silently drifts out of sync. It's a reasonable trade-off for a small team working on one board together. If this needed to scale to much heavier concurrent editing, the "correct" answer is operational transforms or CRDTs, which actually merge conflicting edits instead of just picking a winner — a good chunk more complex, and something I'd look at if this ever grew beyond a portfolio project.

**JWT in an httpOnly cookie, not localStorage.**
Sessions are stored as httpOnly cookies rather than in `localStorage`. `localStorage` is readable by any JavaScript running on the page, which makes it a target for XSS-based token theft. An httpOnly cookie is invisible to JavaScript entirely and just gets sent automatically by the browser.

**PostgreSQL over MongoDB.**
The data here is naturally relational — boards have members, lists belong to boards, cards belong to lists and point to an assignee. Modeling that in a document database means either duplicating data across documents or manually managing references anyway, without getting real joins or transactional guarantees in return. Postgres was just the better fit for this shape of data from day one.

## Known limitations

Things I'm aware of and chose not to solve yet, rather than things I missed:

- No granular roles (admin/editor/viewer) — board membership is flat, so anyone added to a board can edit anything on it.
- No file attachments on cards.
- No email notifications.
- A connected socket client isn't re-checked against board membership on every single event — REST endpoints fully enforce access, but the socket layer trusts the room you joined. Fine for a small trusted team, would need tightening for anything multi-tenant.
- Fractional positions aren't rebalanced automatically (see above).

## Local setup

**Requires:** Docker Desktop (recommended — one command, no local Postgres/Node setup needed), or Node.js 20+ and a local PostgreSQL instance if running without Docker.

### Option A — Docker (recommended)

```bash
git clone https://github.com/Devansh070/TaskFlow.git
cd TaskFlow
cp .env.example .env            # then fill in a real JWT_SECRET
docker-compose up --build
```

Once containers are up, run migrations and seed data (one-time):

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
```

Visit `http://localhost:5173`. Log in with the seeded demo account, or sign up fresh.

### Option B — without Docker

```bash
# Backend
cd backend
cp .env.example .env            # point DATABASE_URL at your local Postgres
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                     # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                     # http://localhost:5173
```

## API overview

All routes are prefixed with `/api`. Protected routes require a valid session cookie.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create an account |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Clear session |
| GET | `/boards` | List boards you're a member of |
| POST | `/boards` | Create a board |
| GET | `/boards/:id` | Get a board with its lists and cards |
| POST | `/boards/:id/members` | Add a member by email |
| GET | `/boards/:id/activity` | Recent activity feed |
| POST | `/boards/:id/lists` | Create a list |
| PATCH | `/lists/:id` | Rename or reposition a list |
| DELETE | `/lists/:id` | Delete a list |
| POST | `/cards` | Create a card |
| PATCH | `/cards/:id` | Update a card (title, description, due date, assignee, list, position) |
| DELETE | `/cards/:id` | Delete a card |

Real-time events (Socket.io, one room per board: `board:<id>`): `list:created`, `list:updated`, `list:deleted`, `card:created`, `card:updated`, `card:deleted`, `activity:created`.

## What's next

If I keep working on this, in rough order of what I'd actually tackle:

- CRDT-based conflict resolution, replacing the current last-write-wins approach
- Per-member roles instead of flat membership
- Automated position rebalancing
- Tightening socket-level access checks to match the REST layer

---

I built this to get real hands-on experience with the parts of a full-stack app that are easy to gloss over in a tutorial — live sync across clients, optimistic UI that has to gracefully handle failure, and actually containerizing and running the whole thing end to end rather than just describing how it would work.
