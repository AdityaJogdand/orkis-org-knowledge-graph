# PLAN.md — Authentication & User Schema

**Project:** Organizational Memory Graph with Cognitive Load Simulation (OMG-CLS)
**Scope of this document:** the login / identity / role schema only — for four roles:
**Associate Dean, Programme Chairperson, Faculty, Student.**
Everything else (graph retrieval, CLS, dashboards) is out of scope here and will
get its own plan.

---

## 1. Goal

Give the system a single, secure way to:

- register and authenticate the four institutional roles,
- know *who* a request comes from and *what role* they hold,
- attach role-scoped permissions that later gate what each user can retrieve from
  the Organizational Memory Graph (role-based retrieval).

Auth data (identity, credentials, roles) lives in **PostgreSQL** — it is
relational, transactional, and sensitive. The **Neo4j memory graph** stores the
*organizational* view of a person (their teaching, committees, dependencies); the
two are linked by a shared `person_id`, but credentials never live in the graph.

---

## 2. Stack for this slice

| Concern | Choice | Why |
|---|---|---|
| Language / API | Python · FastAPI | Async, typed, matches project stack |
| Relational store | PostgreSQL | Users, roles, sessions, audit |
| ORM / migrations | SQLAlchemy 2.x + Alembic | Typed models, versioned schema |
| Password hashing | `passlib` (bcrypt/argon2) | Never store plaintext |
| Tokens | JWT (access + refresh) via `python-jose` | Stateless access, rotating refresh |
| Validation | Pydantic v2 | Request/response schemas |
| Config / secrets | `pydantic-settings` + `.env` | No secrets in code |

---

## 3. Roles

Four roles, ordered by breadth of access (broadest first):

| Role | Code | Typical scope |
|---|---|---|
| Associate Dean | `associate_dean` | Institute-wide oversight, approvals, analytics |
| Programme Chairperson | `programme_chair` | One programme: faculty, courses, students under it |
| Faculty | `faculty` | Own teaching, mentees, committees, allocations |
| Student | `student` | Own records, schedule, public info |

Design decision: keep roles as a **lookup table + a `user_roles` join**, not a
single enum column. A person can, in reality, hold more than one role (a faculty
member who is *also* a programme chair). A join table models that cleanly and
avoids a later migration.

---

## 4. Schema (PostgreSQL)

### 4.1 Entity overview

```
users ──< user_roles >── roles
  │
  ├──1:1── faculty_profiles      (if user has faculty/chair/dean role)
  ├──1:1── student_profiles      (if user has student role)
  ├──1:*── refresh_tokens
  └──1:*── auth_audit_log
```

### 4.2 Tables

**`roles`** — static lookup, seeded once.

| column | type | notes |
|---|---|---|
| id | SERIAL PK | |
| code | VARCHAR(32) UNIQUE | `associate_dean` … `student` |
| label | VARCHAR(64) | Human-readable |
| rank | SMALLINT | 1 = broadest … 4 = narrowest (for quick comparisons) |

**`users`** — one row per human, credentials live here.

| column | type | notes |
|---|---|---|
| id | UUID PK (default gen_random_uuid) | shared `person_id` used to link to Neo4j |
| email | CITEXT UNIQUE NOT NULL | case-insensitive; institutional email |
| password_hash | TEXT NOT NULL | bcrypt/argon2; never plaintext |
| full_name | VARCHAR(120) NOT NULL | |
| is_active | BOOLEAN default true | disable without deleting |
| is_email_verified | BOOLEAN default false | |
| last_login_at | TIMESTAMPTZ NULL | |
| failed_login_count | SMALLINT default 0 | for lockout |
| locked_until | TIMESTAMPTZ NULL | temporary lockout after N failures |
| created_at / updated_at | TIMESTAMPTZ | audit |

**`user_roles`** — many-to-many.

| column | type | notes |
|---|---|---|
| user_id | UUID FK → users(id) ON DELETE CASCADE | |
| role_id | INT FK → roles(id) | |
| PRIMARY KEY (user_id, role_id) | | one role once per user |

**`faculty_profiles`** — extra fields for dean / chair / faculty.

| column | type | notes |
|---|---|---|
| user_id | UUID PK FK → users(id) | |
| employee_code | VARCHAR(32) UNIQUE | institutional ID |
| department | VARCHAR(80) | |
| programme_id | INT NULL | which programme (chairs/faculty belong to one) |
| designation | VARCHAR(64) | e.g. "Associate Professor" |
| date_of_joining | DATE NULL | |

**`student_profiles`** — extra fields for students.

| column | type | notes |
|---|---|---|
| user_id | UUID PK FK → users(id) | |
| roll_number | VARCHAR(32) UNIQUE | |
| programme_id | INT | enrolled programme |
| batch_year | SMALLINT | e.g. 2023 |
| current_semester | SMALLINT | |
| enrollment_status | VARCHAR(16) | active / on_leave / graduated |

**`refresh_tokens`** — rotating refresh tokens (one row per issued token).

| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users(id) ON DELETE CASCADE | |
| token_hash | TEXT NOT NULL | store a hash, never the raw token |
| expires_at | TIMESTAMPTZ NOT NULL | |
| revoked | BOOLEAN default false | set true on logout / rotation |
| created_at | TIMESTAMPTZ | |

**`auth_audit_log`** — security trail (also feeds the "audit-ready" project goal).

| column | type | notes |
|---|---|---|
| id | BIGSERIAL PK | |
| user_id | UUID NULL FK → users(id) | null if login failed on unknown email |
| event | VARCHAR(32) | login_success, login_fail, logout, lockout, token_refresh |
| ip_address | INET NULL | |
| user_agent | TEXT NULL | |
| created_at | TIMESTAMPTZ default now() | |

### 4.3 Indexes & constraints

- `users.email` unique (CITEXT handles case-insensitivity).
- Index `user_roles(role_id)` for "list all faculty" style queries.
- Index `faculty_profiles(programme_id)` and `student_profiles(programme_id)`
  for programme-chair scoping.
- Index `refresh_tokens(user_id, revoked)`.
- Partial index `auth_audit_log(user_id)` where `user_id IS NOT NULL`.

---

## 5. Link to the memory graph

`users.id` (UUID) is the canonical **`person_id`**. In Neo4j, the corresponding
`(:Person {person_id})` node carries the *organizational* relationships
(teaches, mentors, sits-on committee, etc.). Auth never reads/writes Neo4j;
retrieval services join the two by `person_id` after the user is authenticated.

Rule: **PostgreSQL answers "who are you and may you log in"; Neo4j answers "what
are you connected to."** Keep them separate.

---

## 6. Pydantic schemas (API contracts)

Keep request/response models thin and explicit; never return `password_hash`.

- `UserRegisterIn` — email, password, full_name, role_code, + role-specific block
  (faculty or student fields) validated conditionally.
- `UserLoginIn` — email, password.
- `TokenPairOut` — access_token, refresh_token, token_type, expires_in.
- `UserOut` — id, email, full_name, roles[], profile (faculty/student), is_active.
  **No credentials, ever.**
- `RefreshIn` — refresh_token.

Validation notes: enforce email format + institutional domain (optional allow-list),
password policy (min length, not all-numeric), and that role-specific fields are
present for the chosen role.

---

## 7. Endpoints (this slice only)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a user (may be admin-gated per role) | admin / open* |
| POST | `/auth/login` | Verify credentials → issue token pair | public |
| POST | `/auth/refresh` | Rotate refresh → new access token | refresh token |
| POST | `/auth/logout` | Revoke current refresh token | access token |
| GET  | `/auth/me` | Current user + roles + profile | access token |

\* Decision to make: students may self-register with institutional email +
verification; faculty / chair / dean accounts are **provisioned by an admin**
(they shouldn't self-assign elevated roles). Enforce this in `/auth/register`.

---

## 8. AuthN / AuthZ flow

1. **Login** → look up user by email → verify password hash → on success issue
   short-lived **access JWT** (~15 min) + longer **refresh token** (~7 days,
   stored hashed). On failure increment `failed_login_count`; lock after N
   (e.g. 5) for a cool-down window.
2. **Access JWT payload**: `sub = user_id`, `roles = [codes]`, `exp`. Signed,
   never stores sensitive data.
3. **Authorization**: a FastAPI dependency `require_role(*allowed)` reads the JWT,
   checks the user's roles, and 403s otherwise. Broader roles inherit nothing
   automatically — permissions are explicit per endpoint (least privilege).
4. **Refresh rotation**: each refresh use revokes the old token and issues a new
   one (detect reuse of a revoked token → force re-login).
5. **Logout**: mark the refresh token revoked.

---

## 9. Security checklist

- [ ] Passwords hashed with bcrypt/argon2; configurable work factor.
- [ ] JWT secret from env; separate signing key per environment.
- [ ] Access tokens short-lived; refresh tokens rotated + hashed at rest.
- [ ] Account lockout + audit log on repeated failures.
- [ ] Email verification before first login (at least for self-registered students).
- [ ] Role elevation (faculty/chair/dean) only via admin provisioning.
- [ ] All auth events written to `auth_audit_log`.
- [ ] HTTPS only; secure + httpOnly cookies if refresh is cookie-based.
- [ ] Rate-limit `/auth/login` and `/auth/register`.

---

## 10. Build order (suggested)

1. Alembic init + `roles` seed migration (four roles).
2. `users`, `user_roles`, profiles migrations.
3. Password hashing + `UserRegisterIn` / `/auth/register`.
4. `/auth/login` + JWT issuance + `TokenPairOut`.
5. `require_role` dependency + `/auth/me`.
6. `refresh_tokens` + `/auth/refresh` + `/auth/logout`.
7. `auth_audit_log` + lockout logic.
8. Tests: one login/permission test per role (dean, chair, faculty, student).

---

## 11. Open decisions (flag before coding)

- **Self-registration policy** per role (esp. who may create faculty/dean).
- **Institutional email domain** allow-list (e.g. only `@college.edu`)?
- **Multi-role** users in v1, or defer to later? (Schema already supports it.)
- **Programme model**: is `programme_id` its own table now, or a later addition?
  (Recommended: a small `programmes` table from the start.)
- Refresh token transport: **JSON body vs httpOnly cookie**.