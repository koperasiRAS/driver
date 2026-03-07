export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const DAILY_TARGET = 170000
export const MONTHLY_WORKING_DAYS = 22
export const MONTHLY_TARGET = DAILY_TARGET * MONTHLY_WORKING_DAYS
export const DEPOSIT_FREQUENCY_DAYS = 2
export const REPORT_LOCK_HOURS = 2
export const REPORT_DEADLINE_HOUR = 23
export const REPORT_DEADLINE_MINUTE = 50
export const TIMEZONE = 'Asia/Jakarta'
