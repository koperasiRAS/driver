-- TRANS RAS: Migration - Expenses table + Remove daily report limit
-- Run this in Supabase SQL Editor

-- 1. Create driver_expenses table
CREATE TABLE IF NOT EXISTS driver_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    driver_id UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN (
            'bbm',
            'makan',
            'parkir',
            'perawatan',
            'lainnya'
        )
    ),
    description TEXT,
    expense_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE driver_expenses ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for driver_expenses
DROP POLICY IF EXISTS "expenses_select_all" ON driver_expenses;

CREATE POLICY "expenses_select_all" ON driver_expenses FOR
SELECT USING (true);

DROP POLICY IF EXISTS "expenses_insert_all" ON driver_expenses;

CREATE POLICY "expenses_insert_all" ON driver_expenses FOR
INSERT
WITH
    CHECK (true);

DROP POLICY IF EXISTS "expenses_update_all" ON driver_expenses;

CREATE POLICY "expenses_update_all" ON driver_expenses FOR
UPDATE USING (true);

DROP POLICY IF EXISTS "expenses_delete_all" ON driver_expenses;

CREATE POLICY "expenses_delete_all" ON driver_expenses FOR DELETE USING (true);

-- 4. Optional: Add order_photos column to daily_reports if not exists
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS order_photos JSONB DEFAULT '[]';

-- 5. Remove any unique constraint on (driver_id, report_date) if it exists
-- This allows multiple reports per day
DO $$
BEGIN
  -- Drop the trigger that limits daily reports if it exists
  DROP TRIGGER IF EXISTS check_daily_report_limit ON daily_reports;
  DROP FUNCTION IF EXISTS check_daily_report_limit();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. Index for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_driver_date ON driver_expenses (driver_id, expense_date);