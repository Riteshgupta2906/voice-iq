# Voice IQ — Architecture & API Reference

## What Is Voice IQ?

Voice IQ is a proof-of-concept Learning Management System that replaces passive lecture completion checkboxes with **AI voice verification**. When a student finishes a lecture, the system dispatches an AI phone call that asks them 3 comprehension questions, scores their understanding, and flags weak topics — all automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 18, Tailwind CSS, Lucide icons |
| Database | PostgreSQL via Prisma ORM 6 |
| Hosting / DB | Supabase (Postgres + storage) |
| AI — Questions | Google Gemini (Flash) |
| AI — Voice calls | Bolna AI (outbound calling agent) |

---

## Project Structure

```
voice-iq/
├── app/
│   ├── page.js                          # Landing page
│   ├── login/page.js                    # Role selector (Admin vs Student)
│   ├── admin/page.js                    # Admin portal
│   ├── student/page.js                  # Student portal + login gate
│   └── api/
│       ├── auth/student/route.js        # Student login
│       ├── candidates/route.js          # Student CRUD
│       ├── courses/route.js             # Course CRUD
│       ├── courses/[courseId]/
│       │   └── lectures/route.js        # Add lecture to course
│       ├── lecture-progress/route.js    # Track STARTED / COMPLETED
│       ├── voice-calls/route.js         # Trigger outbound AI call
│       ├── voice-calls/[id]/
│       │   └── sync/route.js            # Pull latest call data from Bolna
│       └── webhook/bolna/route.js       # Bolna push-webhook receiver
├── components/
│   ├── admin/candidate-form.js          # 3-tab admin dashboard
│   ├── student/student-dashboard.js     # Lecture player + completion flow
│   ├── providers/
│   │   ├── app-data-provider.js         # Global courses + candidates state
│   │   └── progress-provider.js        # Legacy mock progress (unused in main flow)
│   └── ui/
│       ├── button.js / card.js / input.js / textarea.js / badge.js / tabs.js
├── lib/
│   ├── prisma.js                        # Prisma singleton
│   ├── gemini.js                        # Question generation
│   └── utils.js                         # cn() class helper
└── prisma/
    └── schema.prisma                    # Full DB schema
```

---

## Database Schema

```
User
 ├── id, fullName, email, phone, cohort
 ├── role: ADMIN | STUDENT
 ├── enrollments → CourseEnrollment[]
 └── lectureProgresses → LectureProgress[]

Course
 ├── id, name, description
 ├── lectures → Lecture[]
 └── enrollments → CourseEnrollment[]

Lecture
 ├── id, slug, title, youtubeUrl, transcription, order
 ├── courseId → Course
 ├── questions → LectureQuestion[]
 └── lectureProgresses → LectureProgress[]

CourseEnrollment          (join: User ↔ Course)
 └── userId, courseId, enrolledAt

LectureProgress           (one per student × lecture)
 ├── id, status: STARTED | COMPLETED
 ├── startedAt, completedAt
 ├── userId → User
 ├── lectureId → Lecture
 └── voiceCalls → VoiceCall[]
     @@unique([userId, lectureId])

VoiceCall                 (owned by LectureProgress)
 ├── id, status: QUEUED → INITIATED → RINGING → IN_PROGRESS → COMPLETED | CALL_DISCONNECTED
 ├── callProvider ("bolna"), callSessionId
 ├── transcript, recording (URL), summary
 ├── comprehensionScore (0–100), weakTopics (String[])
 ├── createdAt, completedAt
 └── lectureProgressId → LectureProgress
     @@unique([lectureProgressId])

LectureQuestion           (generated once per lecture by Gemini)
 ├── id, question, expected, followUp
 └── lectureId → Lecture
```

**Key design decision:** `VoiceCall` is only linked to `LectureProgress`, not directly to `User` or `Lecture`. User and Lecture are always reached through the progress record.

---

## API Reference

### Authentication

#### `POST /api/auth/student`
Student login. Matches by first name prefix (case-insensitive) + exact phone.

**Request**
```json
{ "name": "Ritesh", "phone": "+919068726608" }
```
**Response `200`**
```json
{
  "id": "cuid",
  "name": "Ritesh Kumar Gupta",
  "phone": "+919068726608",
  "cohort": "Batch A",
  "courseId": "cuid",
  "courseName": "Java Fundamentals",
  "lectures": [
    { "id": "cuid", "title": "Class & Object Theory", "slug": "class-object-theory",
      "youtubeUrl": "https://...", "transcription": "...", "order": 0 }
  ]
}
```
**Errors:** `400` missing fields · `404` no match found

---

### Courses

#### `GET /api/courses`
All courses with their lectures and enrollment counts.

#### `POST /api/courses`
**Request:** `{ "name": "Java Fundamentals", "description": "..." }`
**Response `201`:** Created course object.

#### `POST /api/courses/[courseId]/lectures`
**Request:** `{ "title": "Class & Object Theory", "youtubeUrl": "...", "transcription": "..." }`
Slug is auto-generated from title. Order is auto-incremented.
**Response `201`:** Created lecture object.

---

### Candidates

#### `GET /api/candidates`
All students with enrollments, lecture progress, and voice call data.

**Response** (array):
```json
{
  "id": "cuid",
  "name": "Ritesh Kumar Gupta",
  "email": "ritesh@example.com",
  "phone": "+919068726608",
  "cohort": "Batch A",
  "courseId": "cuid",
  "courseName": "Java Fundamentals",
  "assignedOn": "2026-03-20T...",
  "lectures": [
    {
      "id": "cuid",
      "title": "Class & Object Theory",
      "order": 0,
      "progress": {
        "id": "cuid",
        "status": "COMPLETED",
        "startedAt": "...",
        "completedAt": "...",
        "voiceCall": {
          "id": "cuid",
          "status": "COMPLETED",
          "transcript": "...",
          "recording": "https://...",
          "comprehensionScore": 33,
          "weakTopics": ["Difference between property and behavior", "..."],
          "summary": "...",
          "callSessionId": "..."
        }
      }
    }
  ]
}
```

#### `POST /api/candidates`
Register a new student and enroll them in a course.

**Request:** `{ "name": "Ritesh Kumar Gupta", "email": "...", "phone": "...", "cohort": "Batch A", "courseId": "cuid" }`
**Response `201`:** Created candidate.
**Errors:** `409` duplicate email.

---

### Lecture Progress

#### `GET /api/lecture-progress?userId=xxx`
All progress records for a student, including nested voice call data.

**Response** (array):
```json
{
  "id": "cuid",
  "lectureId": "cuid",
  "status": "COMPLETED",
  "startedAt": "...",
  "completedAt": "...",
  "voiceCalls": [
    { "id": "cuid", "status": "COMPLETED", "comprehensionScore": 33, "weakTopics": [...], "summary": "..." }
  ]
}
```

#### `POST /api/lecture-progress`
Upsert a progress record.

**Request:** `{ "userId": "cuid", "lectureId": "cuid", "status": "STARTED" | "COMPLETED" }`

- `STARTED` — creates record if none exists; no-op if already exists
- `COMPLETED` — always upserts with `completedAt` timestamp

---

### Voice Calls

#### `POST /api/voice-calls`
Mark a lecture complete and trigger an AI phone call. Idempotent — returns existing call if one already exists.

**Request:** `{ "userId": "cuid", "lectureId": "cuid" }`

**Internal flow:**
1. Upserts `LectureProgress` → `COMPLETED`
2. Checks for existing `VoiceCall` (returns early if found)
3. Generates quiz questions via Gemini if none exist for this lecture
4. Picks 3 random questions
5. Creates `VoiceCall` record (status: `QUEUED`)
6. Calls Bolna API with student phone, lecture topic, and questions
7. Updates `VoiceCall` → `INITIATED` with `callSessionId`

**Response `201`:** VoiceCall record.

#### `GET /api/voice-calls?userId=xxx`
All voice calls for a student, with nested lecture data via `lectureProgress`.

#### `POST /api/voice-calls/[voiceCallId]/sync`
Pull the latest call state from Bolna and update the DB record.

Fetches `GET https://api.bolna.ai/executions/{callSessionId}` and saves:
- `status`, `transcript`, `recording` URL
- `comprehensionScore`, `weakTopics`, `summary` from `extracted_data`
- `completedAt` if call is complete

Returns early (no-op) if already `COMPLETED` with all fields populated.

---

### Webhooks

#### `POST /api/webhook/bolna`
Receives real-time status updates pushed by Bolna during and after calls.

**Bolna payload fields used:**
- `execution_id` / `id` → matched to `VoiceCall.callSessionId`
- `status` → mapped to `CallStatus` enum
- On `completed`: `transcript`, `summary`, `telephony_data.recording_url`, `extracted_data.comprehension_score`, `extracted_data.weak_topics`

Updates the matching `VoiceCall` record. Returns `{ received: true }` regardless of outcome (Bolna requires 200).

---

## Key User Flows

### Admin registers a student

```
Admin fills form (Management tab)
  → POST /api/candidates
  → User + CourseEnrollment created in DB transaction
  → Candidate appears in Candidates tab
```

### Student logs in

```
/student page renders StudentLoginForm
  → Student enters first name + phone
  → POST /api/auth/student
  → Returns full student data (course + lectures)
  → Stored in sessionStorage as "voiceiq_student"
  → StudentDashboard renders with that data
```

### Student watches and completes a lecture

```
Student clicks a lecture in the sidebar
  → POST /api/lecture-progress { status: "STARTED" }   ← fire-and-forget

Student watches YouTube video to completion

Student clicks "Mark as completed"
  → POST /api/voice-calls { userId, lectureId }
      ├─ Upserts LectureProgress → COMPLETED
      ├─ Generates Gemini questions (if first time)
      ├─ Creates VoiceCall record
      └─ Calls Bolna → student's phone rings

Bolna webhook / sync updates VoiceCall status:
  QUEUED → INITIATED → RINGING → IN_PROGRESS → COMPLETED

VoiceCall.comprehensionScore, weakTopics, summary populated
  → Student dashboard shows results card
  → Admin dashboard shows score badge + transcript
```

---

## External Services

### Google Gemini (`lib/gemini.js`)
Called once per lecture when the first student marks it complete.
Prompt: lecture title + full transcription → 6 Q&A pairs with follow-ups.
Questions are stored in `LectureQuestion` and reused for all future students.

### Bolna AI
Outbound calling agent. Receives `questions` as a JSON string in `user_data`.
Handles the call conversation, scores comprehension, extracts weak topics.
Communicates back via webhook push **and** a pull API (`/executions/{id}`).

---

## Environment Variables

```bash
DATABASE_URL=          # Postgres connection (pooled)
DIRECT_URL=            # Postgres direct connection (for Prisma migrations)
BOLNA_API_KEY=         # Bolna API auth token
AGENT_ID=              # Bolna agent ID configured for voice verification
BOLNA_FROM_PHONE=      # Outbound caller ID registered in Bolna
GEMINI_API_KEY=        # Google Gemini API key
NEXT_PUBLIC_SUPABASE_URL=  # Supabase project URL (for image domains)
```
