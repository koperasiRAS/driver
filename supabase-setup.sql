-- TRANS RAS Driver Management System - Database Setup (Updated)
-- Run this in Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'driver')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_reports table (updated with order photos)
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('narik', 'tidak_narik')),
  daily_income NUMERIC,
  number_of_orders INTEGER,
  platform TEXT CHECK (platform IN ('lalamove', 'direct_call', 'mixed')),
  reason TEXT CHECK (reason IN ('libur', 'sakit', 'vehicle_issue', 'no_orders', 'personal_matter', 'other')),
  notes TEXT,
  photo_url TEXT,
  -- NEW: Order receipt photos for transparency
  order_photos JSONB DEFAULT '[]', -- Array of {amount, photo_url, description}
  is_locked BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weekly_reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_income NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_deposits NUMERIC DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, week_start)
);

-- Create monthly_reports table
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month
  total_income NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_deposits NUMERIC DEFAULT 0,
  working_days INTEGER DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, month)
);

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'transfer')),
  proof_photo_url TEXT,
  deposit_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table (updated)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create driver_locations table
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude NUMERIC,
  longitude NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Drivers RLS Policies
DROP POLICY IF EXISTS "drivers_select_all" ON drivers;
CREATE POLICY "drivers_select_all" ON drivers FOR SELECT USING (true);
DROP POLICY IF EXISTS "drivers_insert_owner" ON drivers;
CREATE POLICY "drivers_insert_owner" ON drivers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "drivers_update_all" ON drivers;
CREATE POLICY "drivers_update_all" ON drivers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "drivers_delete_all" ON drivers;
CREATE POLICY "drivers_delete_all" ON drivers FOR DELETE USING (true);

-- Daily Reports RLS Policies
DROP POLICY IF EXISTS "reports_select_all" ON daily_reports;
CREATE POLICY "reports_select_all" ON daily_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "reports_insert_driver" ON daily_reports;
CREATE POLICY "reports_insert_driver" ON daily_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "reports_update_all" ON daily_reports;
CREATE POLICY "reports_update_all" ON daily_reports FOR UPDATE USING (true);

-- Weekly Reports RLS Policies
DROP POLICY IF EXISTS "weekly_select_all" ON weekly_reports;
CREATE POLICY "weekly_select_all" ON weekly_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "weekly_insert_driver" ON weekly_reports;
CREATE POLICY "weekly_insert_driver" ON weekly_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "weekly_update_all" ON weekly_reports;
CREATE POLICY "weekly_update_all" ON weekly_reports FOR UPDATE USING (true);

-- Monthly Reports RLS Policies
DROP POLICY IF EXISTS "monthly_select_all" ON monthly_reports;
CREATE POLICY "monthly_select_all" ON monthly_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "monthly_insert_driver" ON monthly_reports;
CREATE POLICY "monthly_insert_driver" ON monthly_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "monthly_update_all" ON monthly_reports;
CREATE POLICY "monthly_update_all" ON monthly_reports FOR UPDATE USING (true);

-- Deposits RLS Policies
DROP POLICY IF EXISTS "deposits_select_all" ON deposits;
CREATE POLICY "deposits_select_all" ON deposits FOR SELECT USING (true);
DROP POLICY IF EXISTS "deposits_insert_driver" ON deposits;
CREATE POLICY "deposits_insert_driver" ON deposits FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "deposits_update_all" ON deposits;
CREATE POLICY "deposits_update_all" ON deposits FOR UPDATE USING (true);

-- Activity Logs RLS Policies
DROP POLICY IF EXISTS "audit_select_all" ON activity_logs;
CREATE POLICY "audit_select_all" ON activity_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "audit_insert_all" ON activity_logs;
CREATE POLICY "audit_insert_all" ON activity_logs FOR INSERT WITH CHECK (true);

-- Driver Locations RLS Policies
DROP POLICY IF EXISTS "locations_select_all" ON driver_locations;
CREATE POLICY "locations_select_all" ON driver_locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "locations_insert_all" ON driver_locations;
CREATE POLICY "locations_insert_all" ON driver_locations FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_driver_date ON daily_reports(driver_id, report_date);
CREATE INDEX IF NOT EXISTS idx_deposits_driver_date ON deposits(driver_id, deposit_date);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_driver ON weekly_reports(driver_id, week_start);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_driver ON monthly_reports(driver_id, month);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for driver photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-photos', 'driver-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for driver photos
DROP POLICY IF EXISTS "driver_photos_access" ON storage.objects;
CREATE POLICY "driver_photos_access"
ON storage.objects FOR ALL
USING ( bucket_id = 'driver-photos' );

-- Function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_driver_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (user_id, driver_id, action, table_name, record_id, details)
  VALUES (p_user_id, p_driver_id, p_action, p_table_name, p_record_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
