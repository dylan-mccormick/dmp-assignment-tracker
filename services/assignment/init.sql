-- init.sql
-- Initialization for the assignment service database

-- a global, read-only list of types (no user_id), seeded below
CREATE TABLE IF NOT EXISTS assignment_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT UNIQUE NOT NULL
);

INSERT INTO assignment_type (value)
VALUES ('Homework'), ('Quiz'), ('Exam'), ('Project'), ('Lab'), ('Reading'), ('Other')
ON CONFLICT (value) DO NOTHING;

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
    -- types are shared by every user, so a type that's in use can't be deleted (CASCADE would delete everyone's)
    type_id UUID NOT NULL REFERENCES assignment_type(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    early_due TIMESTAMPTZ,
    due TIMESTAMPTZ NOT NULL,
    late_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- the optional early and late deadlines bracket the main one (NULL comparisons pass the CHECK)
    CONSTRAINT assignments_due_order CHECK (early_due <= due AND due <= late_due)
);

-- Create Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_semesters_user_id ON semesters(user_id);
-- semester names are unique per user, ignoring case (overlapping dates are fine)
CREATE UNIQUE INDEX IF NOT EXISTS uq_semesters_user_name ON semesters(user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
-- class names are unique per semester, ignoring case (the same class can be retaken in another semester);
-- this index also serves lookups by semester_id, so it replaces a plain index on that column
CREATE UNIQUE INDEX IF NOT EXISTS uq_classes_semester_name ON classes(semester_id, LOWER(name));
-- "my assignments" and "this class's assignments" are both listed in due order, so the indexes include due
CREATE INDEX IF NOT EXISTS idx_assignments_user_due ON assignments(user_id, due);
CREATE INDEX IF NOT EXISTS idx_assignments_class_due ON assignments(class_id, due);
