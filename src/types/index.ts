export type UserRole = 'owner' | 'driver'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  user_id: string
  vehicle_type?: string
  vehicle_plate?: string
  is_active: boolean
  created_at: string
  updated_at: string
  profile?: Profile
}

export type ReportStatus = 'narik' | 'tidak_narik'
export type Platform = 'lalamove' | 'direct_call' | 'mixed'
export type Reason = 'libur' | 'sakit' | 'vehicle_issue' | 'no_orders' | 'personal_matter' | 'other'

// Order photo with amount for transparency
export interface OrderPhoto {
  amount: number
  photo_url: string
  description?: string
}

export interface DailyReport {
  id: string
  driver_id: string
  report_date: string
  status: ReportStatus
  daily_income?: number
  number_of_orders?: number
  platform?: Platform
  reason?: Reason
  notes?: string
  photo_url?: string
  order_photos?: OrderPhoto[] // Array of order receipts
  is_locked: boolean
  submitted_at: string
  created_at: string
  driver?: Driver
}

export type DepositMethod = 'cash' | 'transfer'
export type DepositStatus = 'pending' | 'approved' | 'rejected'

export interface Deposit {
  id: string
  driver_id: string
  amount: number
  method: DepositMethod
  proof_photo_url?: string
  deposit_date: string
  status: DepositStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  driver?: Driver
}

// Weekly report
export interface WeeklyReport {
  id: string
  driver_id: string
  week_start: string
  week_end: string
  total_income: number
  total_orders: number
  total_deposits: number
  notes?: string
  submitted_at: string
  created_at: string
  driver?: Driver
}

// Monthly report
export interface MonthlyReport {
  id: string
  driver_id: string
  month: string
  total_income: number
  total_orders: number
  total_deposits: number
  working_days: number
  notes?: string
  submitted_at: string
  created_at: string
  driver?: Driver
}

export interface AuditLog {
  id: string
  user_id?: string
  driver_id?: string
  action: string
  table_name: string
  record_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface DashboardStats {
  totalDrivers: number
  todayReports: number
  pendingDeposits: number
  monthlyDeposits: number
  monthlyTarget: number
}

export interface MonthlyData {
  month: string
  totalDeposits: number
  target: number
}

export interface DriverPerformance {
  driverId: string
  driverName: string
  totalDeposits: number
  totalReports: number
  reportsWithIncome: number
}

// Monthly settlement record (Setor ke BOS)
export interface MonthlySettlement {
  id: string
  settled_year: number
  settled_month: number
  total_amount: number
  settled_by?: string
  settled_at: string
  notes?: string
  created_at: string
}
