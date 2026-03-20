# Voice IQ

An LMS that verifies if a student actually learned — not just whether they clicked through.

When a learner marks a lecture complete, an AI voice agent calls them, asks topic-aware questions derived from the lecture transcript, and reports a comprehension score back to the admin.

---

## How it works

1. **Admin creates a course** — adds lectures (YouTube URL + transcript)
2. **Admin registers a candidate** — assigns them to the course
3. **Candidate watches lectures** — marks each one complete
4. **AI voice agent calls** — asks 3 questions, scores comprehension
5. **Admin reviews results** — score, weak topics, transcript, and recording

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Voice AI | Bolna |
| Question generation | Google Gemini |
| UI | Tailwind CSS + shadcn/ui + Lucide |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase connection pooling URL |
| `DIRECT_URL` | Supabase direct connection URL (for migrations) |
| `AGENT_ID` | Bolna agent ID |
| `BOLNA_API_KEY` | Bolna API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ADMIN_AUTH_KEY` | Password to access the admin portal |
| `CANDIDATE_AUTH_KEY` | Password candidates use to sign in |

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Portals

| Portal | Route | Access |
|---|---|---|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Admin | `/admin` | `ADMIN_AUTH_KEY` |
| Candidate | `/student` | `CANDIDATE_AUTH_KEY` |

---

## Project structure

```
app/
  page.js              # Landing page
  login/page.js        # Portal selection
  admin/page.js        # Admin dashboard (auth-gated)
  student/page.js      # Candidate dashboard (auth-gated)
  api/
    auth/admin/        # POST — verify admin key
    auth/candidate/    # POST — verify candidate key + return data
    candidates/        # GET/POST — roster management
    courses/           # GET/POST — course management
    lecture-progress/  # GET/POST — track completion
    voice-calls/       # POST — trigger Bolna call
    webhook/bolna/     # POST — receive call status updates
components/
  admin/               # CandidateForm (registration + roster)
  student/             # StudentDashboard + lecture player
  providers/           # AppDataProvider, ProgressProvider
```
