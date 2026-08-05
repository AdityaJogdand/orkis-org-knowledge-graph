-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email

-- ─── roles ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id    SERIAL PRIMARY KEY,
    code  VARCHAR(32)  UNIQUE NOT NULL,
    label VARCHAR(64)  NOT NULL,
    rank  SMALLINT     NOT NULL   -- 1 = broadest (dean) … 4 = narrowest (student)
);

INSERT INTO roles (code, label, rank) VALUES
    ('associate_dean',   'Associate Dean',         1),
    ('programme_chair',  'Programme Chairperson',  2),
    ('faculty',          'Faculty',                3),
    ('student',          'Student',                4)
ON CONFLICT (code) DO NOTHING;

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT       UNIQUE NOT NULL,
    password_hash       TEXT         NOT NULL,
    full_name           VARCHAR(120) NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ  NULL,
    failed_login_count  SMALLINT     NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ  NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── user_roles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
    user_id  UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id  INT   NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ─── faculty_profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_profiles (
    user_id         UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employee_code   VARCHAR(32)  UNIQUE NOT NULL,
    department      VARCHAR(80)  NOT NULL,
    programme_id    INT          NULL,
    designation     VARCHAR(64)  NOT NULL,
    date_of_joining DATE         NULL
);

CREATE INDEX IF NOT EXISTS idx_faculty_profiles_programme_id ON faculty_profiles(programme_id);

-- ─── student_profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id           UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    roll_number       VARCHAR(32) UNIQUE NOT NULL,
    programme_id      INT         NOT NULL,
    batch_year        SMALLINT    NOT NULL,
    current_semester  SMALLINT    NOT NULL,
    enrollment_status VARCHAR(16) NOT NULL DEFAULT 'active'
        CHECK (enrollment_status IN ('active', 'on_leave', 'graduated'))
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_programme_id ON student_profiles(programme_id);

-- ─── refresh_tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_revoked ON refresh_tokens(user_id, revoked);

-- ─── auth_audit_log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        NULL REFERENCES users(id) ON DELETE SET NULL,
    event       VARCHAR(32) NOT NULL
        CHECK (event IN ('login_success','login_fail','logout','lockout','token_refresh')),
    ip_address  INET        NULL,
    user_agent  TEXT        NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id)
    WHERE user_id IS NOT NULL;

-- ─── auto-update updated_at on users ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
