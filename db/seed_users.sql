-- ─── Seed: Associate Dean — Dr. Preeti Gupta ─────────────────────────────────
-- Role   : associate_dean  (rank 1 — broadest / full institute-wide access)
-- Email  : preeti.gupta@college.edu
-- Password (temporary, must be changed on first login): PreetiDean@2024
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_user_id UUID;
    v_role_id  INT;
BEGIN
    -- 1. Insert user (bcrypt via pgcrypto; skip if email already exists)
    INSERT INTO users (
        email,
        password_hash,
        full_name,
        is_active,
        is_email_verified
    )
    VALUES (
        'preeti.gupta@college.edu',
        crypt('PreetiDean@2024', gen_salt('bf', 12)),
        'Dr. Preeti Gupta',
        TRUE,
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_user_id;

    -- If the row already existed, fetch its id
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE email = 'preeti.gupta@college.edu';
    END IF;

    -- 2. Resolve the associate_dean role id
    SELECT id INTO v_role_id FROM roles WHERE code = 'associate_dean';

    -- 3. Assign role (idempotent)
    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT DO NOTHING;

    -- 4. Create faculty profile (associate deans share the faculty_profiles table)
    INSERT INTO faculty_profiles (
        user_id,
        employee_code,
        department,
        designation,
        date_of_joining
    )
    VALUES (
        v_user_id,
        'AD001',
        'Administration',
        'Associate Dean',
        CURRENT_DATE
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Associate Dean Dr. Preeti Gupta provisioned (user_id = %)', v_user_id;
END $$;
