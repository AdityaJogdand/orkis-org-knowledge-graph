# Orkis API — Frontend Integration Reference

**Base URL:** `http://localhost:8001`
**All requests:** `Content-Type: application/json`
**Protected routes:** `Authorization: Bearer <access_token>`

---

## Auth Endpoints

### POST `/auth/login`
Password-based login. Returns a token pair.

**Request**
```json
{ "email": "user@nmims.in", "password": "yourpassword" }
```
**Response `200`**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "token_type": "bearer"
}
```

---

### POST `/auth/otp/request`
Sends a 6-digit OTP to the user's registered email. Always returns `202` (even if email not found).

**Request**
```json
{ "email": "user@nmims.in" }
```
**Response `202`**
```json
{ "detail": "If that email is registered, an OTP has been sent." }
```

---

### POST `/auth/otp/verify`
Verifies the OTP and returns a token pair. OTP expires in **10 minutes** and is single-use.

**Request**
```json
{ "email": "user@nmims.in", "otp": "482917" }
```
**Response `200`**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "token_type": "bearer"
}
```
**Response `401`** — wrong or expired OTP
```json
{ "detail": "Invalid or expired OTP" }
```

---

### GET `/auth/me` 🔒
Returns the currently logged-in user's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response `200`**
```json
{
  "id": "uuid",
  "email": "user@nmims.in",
  "full_name": "Aditya Jogdand",
  "roles": ["faculty"],
  "is_active": true
}
```

---

### POST `/auth/refresh`
Exchanges a refresh token for a new token pair. Old refresh token is invalidated.

**Request**
```json
{ "refresh_token": "abc123..." }
```
**Response `200`** — same shape as login response.

---

### POST `/auth/logout` 🔒
Revokes the refresh token.

**Request**
```json
{ "refresh_token": "abc123..." }
```
**Response `200`**
```json
{ "detail": "Logged out" }
```

---

### POST `/auth/change-password` 🔒
Changes the user's password. Invalidates all existing sessions.

**Request**
```json
{ "old_password": "current", "new_password": "newpass123" }
```
**Response `200`**
```json
{ "detail": "Password updated" }
```

---

## Roles

| Role | Code |
|---|---|
| Associate Dean | `associate_dean` |
| Programme Chairperson | `programme_chair` |
| Faculty | `faculty` |
| Student | `student` |

Use the `roles` array from `/auth/me` to control what the user sees in the UI.

---

## Token Handling

| Token | Lifetime | Usage |
|---|---|---|
| `access_token` | 15 minutes | `Authorization: Bearer` header on every protected request |
| `refresh_token` | 7 days | Call `/auth/refresh` when access token expires (HTTP 401) |

**Recommended flow:**
1. On login / OTP verify → store both tokens (memory or httpOnly cookie)
2. On any `401` → call `/auth/refresh` → retry original request with new access token
3. On logout → call `/auth/logout` + clear stored tokens

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| `preeti.gupta@nmims.edu.in` | `Preeti@Gupta123` | associate_dean |
| `aditya.jogdand012@nmims.in` | `Aditya@Test123` | faculty |
| `manan.dedhia045@nmims.in` | `Manan@Dedhia123` | faculty |

---

## Interactive Docs
`http://localhost:8001/docs` — Swagger UI, try all endpoints directly in browser.
