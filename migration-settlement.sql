-- ============================================================
-- Migration: Add monthly_settlements table for BOS settlement
-- Run this in Supabase SQL Editor AFTER supabase-setup.sql
-- ============================================================

-- Create monthly_settlements table
CREATE TABLE IF NOT EXISTS monthly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settled_year INTEGER NOT NULL,
  settled_month INTEGER NOT NULL CHECK (settled_month BETWEEN 1 AND 12),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  settled_by UUID REFERENCES profiles(id),
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(settled_year, settled_month)
);

-- Enable RLS
ALTER TABLE monthly_settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive - follow existing app pattern)
DROP POLICY IF EXISTS "settlements_select_all" ON monthly_settlements;
CREATE POLICY "settlements_select_all" ON monthly_settlements FOR SELECT USING (true);

DROP POLICY IF EXISTS "settlements_insert_all" ON monthly_settlements;
CREATE POLICY "settlements_insert_all" ON monthly_settlements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "settlements_update_all" ON monthly_settlements;
CREATE POLICY "settlements_update_all" ON monthly_settlements FOR UPDATE USING (true);

-- Index for fast "has this month been settled?" checks
CREATE INDEX IF NOT EXISTS idx_monthly_settlements_year_month
  ON monthly_settlements(settled_year, settled_month);
