# CLAUDE.md

> Project context for Claude Code and contributors.
> Read this first before generating or editing code. It describes **what** we are
> building, **why**, the **architecture**, the **conventions**, and the **use
> cases** the system must serve.

---

## 1. What this project is

**Organizational Memory Graph with Cognitive Load Simulation (OMG-CLS)**

An AI & Data Science capstone project: an intelligent, explainable knowledge-
management and decision-support platform for an academic institution (modelled on
NMIMS STME, but designed to generalize to any institution).

It does three things that ordinary systems don't:

1. **Represents institutional memory as a knowledge graph** — people, courses,
   committees, decisions, documents and their relationships — instead of siloed
   records in tables.
2. **Retrieves it with GraphRAG + an LLM** — natural-language questions answered
   by walking the graph (multi-hop), with an explainable evidence path.
3. **Adapts delivery to the user's cognitive load** — a Cognitive Load Simulation
   estimates how much a user can absorb and adjusts how much information is
   returned (summaries, re-ranking, progressive disclosure).

One-line pitch: **retrieval that adapts to how much the mind can absorb.**

### The core novelty
GraphRAG improves *what is retrieved*. Cognitive Load Theory explains *what a
human can absorb*. Almost no system uses a live load estimate to control retrieval
output. This project makes **cognitive load a first-class signal in the retrieval
loop**. Preserve this framing in any generated docs or copy.

---

## 2. Guiding principles (apply to all code)

- **Explainable over clever.** Every answer should be traceable to a graph path.
  Never generate output that can't be grounded in retrieved data.
- **Assistive, not autonomous.** The AI prepares plans and drafts; a human (Dean,
  chair, HR) gives the final approval. Keep humans in the loop for anything
  consequential.
- **Least privilege.** Retrieval is role-scoped. A student can never reach
  another student's records or internal notes. Enforce at the data layer, not
  just the UI.
- **Separation of stores.** PostgreSQL = identity/auth/relational/transactional.
  Neo4j = the organizational memory graph. Vector store = embeddings. They link
  by a shared `person_id` (UUID). Credentials never touch the graph.
- **Deterministic where it matters.** Graph traversals and evaluations must be
  reproducible; log the evidence path used for each answer.
- **Privacy by design.** Institutional data is sensitive. Prefer self-hostable
  components; keep audit trails.

---

## 3. Architecture

Layered. Keep concerns in their layer.

```
Presentation   React / Next.js dashboard · query UI · graph explorer · load meter
Application    FastAPI · retrieval orchestration · role-based access control
Intelligence   Hybrid retriever (vector + graph) · LLM reasoner · Cognitive Load
               Simulator · adaptive presenter
Data           Neo4j (memory graph) · Vector DB (FAISS/Chroma/Qdrant) ·
               PostgreSQL (identity, logs) · interaction telemetry
Ingestion      Documents/emails/wikis/records → NLP entity+relation extraction →
               graph + embedding construction
```

### The GraphRAG flow (canonical)
`Ingest → Extract (entities/relations) → Retrieve (vector search → graph walk →
role filter) → Generate (answer + evidence path) → Act/Log`.
The **role filter runs before generation**, so unauthorized facts never reach the
LLM.

### The Cognitive Load Simulation pipeline
Signals (query complexity, result-set size, graph path depth, user familiarity,
interaction telemetry) → **Load Estimator** (intrinsic / extraneous / germane,
per Sweller) → **load score 0–100** → adaptation (summarize, re-rank, progressive
disclosure, simplify graph view) → feedback loop refines the model over time.

---

## 4. Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React / Next.js, Tailwind | Dashboard, query UI, graph explorer |
| API | Python, FastAPI, Pydantic v2 | Async, typed |
| Intelligence | LLM (GPT/Llama), RAG + GraphRAG, embedding models, NLP | LangChain/LlamaIndex optional |
| Graph | Neo4j | The organizational memory graph |
| Vectors | FAISS / Chroma / Qdrant | Semantic recall |
| Relational | PostgreSQL, SQLAlchemy 2.x, Alembic | Identity, auth, logs |
| Auth | JWT (access + refresh), passlib (bcrypt/argon2) | See §7 |
| Infra | Docker, GitHub, cloud deploy | |
| Dev | VS Code, Jupyter | |

Only introduce a technology if it fits this stack. Don't add a second styling
system, ORM, or state library if one already exists — detect and match.

---

## 5. Repository conventions

> Adjust paths to the actual repo layout once established.

- **Backend** (`/backend`): FastAPI. Structure by domain — `auth/`, `graph/`,
  `retrieval/`, `cls/` (cognitive load), `ingestion/`. Each has
  `router.py`, `service.py`, `schemas.py`, `models.py`.
- **Frontend** (`/frontend`): React/Next. Components in `src/components`, pages/
  routes per framework convention. Match existing styling (Tailwind if present).
- **Migrations**: Alembic under `/backend/alembic`. Never edit a committed
  migration; add a new one.
- **Env/secrets**: `pydantic-settings` + `.env` (git-ignored). Never hardcode
  secrets or commit `.env`.
- **Style**: Python — type hints everywhere, `ruff`/`black`. TS — strict mode.
  Prefer small, pure functions; keep side effects at the edges.
- **Tests**: pytest (backend). At minimum, one auth/permission test per role.
- **Commits**: conventional commits (`feat:`, `fix:`, `docs:`…).

---

## 6. Roles & access model

Four institutional roles (broadest → narrowest scope):

| Role | Code | Scope |
|---|---|---|
| Associate Dean | `associate_dean` | Institute-wide oversight, approvals, analytics |
| Programme Chairperson | `programme_chair` | One programme: its faculty, courses, students |
| Faculty | `faculty` | Own teaching, mentees, committees, allocations |
| Student | `student` | Own records, schedule, public info |

- Roles are a **lookup table + `user_roles` join** — a person may hold more than
  one role (faculty who is also a chair).
- Access is **explicit per endpoint** (`require_role(...)`), least-privilege;
  broader roles do **not** auto-inherit narrower permissions.
- The same role model gates **graph retrieval**: the role filter in the retrieval
  pipeline restricts which nodes/facts a query can reach.

---

## 7. Authentication (identity slice)

- **Postgres** stores `users` (UUID id = canonical `person_id`), `roles`,
  `user_roles`, `faculty_profiles`, `student_profiles`, `refresh_tokens`,
  `auth_audit_log`.
- **Login** → verify hashed password → issue short-lived **access JWT** (~15 min)
  + rotating **refresh token** (~7 days, stored hashed). Lockout after N failures.
- **JWT payload**: `sub = user_id`, `roles = [codes]`, `exp`. No sensitive data.
- **Self-registration**: students may self-register with a verified institutional
  email; **faculty / chair / dean are admin-provisioned** (no self-assigned
  elevated roles).
- All auth events → `auth_audit_log` (also feeds the accreditation/audit goal).
- Endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`,
  `/auth/logout`, `GET /auth/me`.

See `PLAN.md` for the full auth schema and build order.

---

## 8. Use cases — what the system must do

These are the concrete scenarios the platform is designed around. They show
**intelligent reasoning over institutional knowledge**, not ERP-style record
storage. Keep them in mind when designing features.

### UC1 — Faculty Leave Impact Analysis
A faculty member (e.g. "Prof. Sharma") applies for leave.
- **Traditional**: HR only approves/rejects.
- **OMG-CLS**: traverses every connected dependency — teaching schedule,
  practical labs, project reviews, examination duty, student mentorship, research
  committee, department meetings, administrative roles, ongoing research projects.
- **AI output**: lists conflicts (e.g. 6 lectures tomorrow, 2 PM lab, project
  review, exam invigilation, committee meeting), suggests **expertise-matched,
  workload-balanced replacements** (e.g. Dr. Mehta, Dr. Kulkarni), detects
  timetable clashes, notifies affected departments, and **estimates operational
  impact**.
- **Point**: a leave request becomes an *institutional impact analysis*.

### UC2 — Automated Midterm Examination Planning
The Dean initiates: *"Prepare Midterm Examinations."*
- **Traditional**: manual emails, waiting on departments, follow-ups, manual
  scheduling, invigilator assignment, room booking, clash resolution.
- **OMG-CLS**: reasons over academic calendar, department structure, courses,
  faculty allocation, student enrollment, classroom availability, previous exam
  schedules, leave applications, exam policies, holidays and constraints; then
  **autonomously drafts emails, generates the timetable, allocates invigilators,
  books classrooms, detects and resolves conflicts, notifies departments, and
  produces a draft ready for Dean approval.**
- **Point**: the AI understands institutional context and *proactively
  coordinates workflows*; the human approves.

### Additional intelligent features (roadmap)
- **Student**: personalized academic dashboard, attendance analytics, GPA/CGPA
  prediction, required-GPA-to-target calculator, study recommendations, at-risk
  detection, course recommendation, timetable assistant, deadline reminders.
- **Faculty**: workload balancing, leave-impact prediction, replacement
  suggestions, committee workload analysis, research-collaboration
  recommendations, lecture-scheduling optimization.
- **Administration**: automated timetable generation, classroom optimization,
  event scheduling, accreditation (NAAC/NBA) documentation assistance, department
  and faculty-utilization analytics, institutional KPI dashboard.
- **Institutional AI assistant** answering questions like: *Which faculty are
  free tomorrow? Who can replace Prof. Sharma? Which students are at risk? Which
  classrooms are free after 2 PM? Who supervises AI projects? Generate tomorrow's
  timetable. Draft examination emails.*

All of the above must respect role scoping and stay assistive (human-approved for
consequential actions).

---

## 9. Data model orientation

- **PostgreSQL**: identity, auth, roles, profiles, audit, interaction logs.
- **Neo4j (memory graph)**: `(:Person)`, `(:Course)`, `(:Committee)`,
  `(:Document)`, `(:Decision)`, `(:Project)`, `(:Programme)`, `(:Classroom)`,
  `(:Exam)` … connected by typed relationships (`teaches`, `mentors`,
  `member_of`, `depends_on`, `governed_by`, `sets_exam`, `enrolled_in`…).
  Linked to Postgres by `person_id`.
- **Vector DB**: embeddings of documents/notes for semantic recall; ids reference
  graph nodes.
- **Interaction telemetry**: dwell time, reformulations, expansions — feeds the
  cognitive-load model.

**Rule of thumb**: relationships and multi-hop reasoning → Neo4j. Identity,
transactions, and anything requiring ACID → PostgreSQL. Semantic similarity →
vector store.

---

## 10. What to optimize for when generating code

- Clarity and correctness over cleverness. Typed, tested, documented.
- Small PRs aligned to the build order in `PLAN.md`.
- Never return credentials or unauthorized facts. Never log secrets.
- Ground LLM answers strictly in retrieved graph context; attach the evidence
  path. If retrieval is empty, say so — don't hallucinate.
- Respect the role filter *before* generation.
- Keep the human-approval step for consequential actions (leave decisions, exam
  timetables, notifications).

---

## 11. Out of scope (for now)

- Physiological load sensing (EEG, eye-tracking).
- Enterprise-scale multi-tenant production deployment.
- Training a custom LLM from scratch.
- Real-time streaming ingestion at scale.
- Full security hardening beyond the auth slice (design-level only for now).

---

## 12. Pointers

- `PLAN.md` — authentication & user schema (current build focus).
- Presentation decks (`/docs` or provided separately) — full project narrative,
  architecture diagrams, use-case visuals, 14-week plan.
- When unsure about scope or a decision, prefer the **assistive, explainable,
  role-scoped** option and leave a `TODO:` with the open question.