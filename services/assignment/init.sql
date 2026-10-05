-- init.sql
-- Initialization for the assignment service database

CREATE TABLE IF NOT EXISTS assignment_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT semesters_end_after_start CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- denormalized for easier querying
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- denormalized for easier querying
    type_id UUID NOT NULL REFERENCES assignment_type(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    early_due TIMESTAMPTZ,
    due TIMESTAMPTZ NOT NULL,
    late_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_semesters_user_id ON semesters(user_id);
-- semester names are unique per user, ignoring case (overlapping dates are fine)
CREATE UNIQUE INDEX IF NOT EXISTS uq_semesters_user_name ON semesters(user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_semester_id ON classes(semester_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
