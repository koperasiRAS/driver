'use client'

import { createClient } from '@/lib/supabase'
import { DailyReport, ReportStatus, Platform, Reason } from '@/types'
import { getTodayDateString } from '@/lib/utils'

export async function getReports(driverId?: string): Promise<DailyReport[]> {
  const supabase = createClient()
  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `)
    .order('submitted_at', { ascending: false })

  if (driverId) {
    query = query.eq('driver_id', driverId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }

  return data || []
}

export async function getTodayReport(driverId: string): Promise<DailyReport | null> {
  const supabase = createClient()
  const today = getTodayDateString()

  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `)
    .eq('driver_id', driverId)
    .eq('report_date', today)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getTodayReportsCount(): Promise<number> {
  const supabase = createClient()
  const today = getTodayDateString()

  const { count, error } = await supabase
    .from('daily_reports')
    .select('*', { count: 'exact', head: true })
    .eq('report_date', today)

  if (error) {
    console.error('Error counting today reports:', error)
    return 0
  }

  return count || 0
}

export async function createReport(reportData: {
  driver_id: string
  report_date: string
  status: ReportStatus
  daily_income?: number
  number_of_orders?: number
  platform?: Platform
  reason?: Reason
  notes?: string
  photo_url?: string
}): Promise<DailyReport | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daily_reports')
    .insert(reportData)
    .select()
    .single()

  if (error) {
    console.error('Error creating report:', error)
    return null
  }

  return data
}

export async function updateReport(
  reportId: string,
  updates: {
    daily_income?: number
    number_of_orders?: number
    platform?: Platform
    reason?: Reason
    notes?: string
    photo_url?: string
  }
): Promise<DailyReport | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daily_reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('Error updating report:', error)
    return null
  }

  return data
}

export async function getReportById(reportId: string): Promise<DailyReport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `)
    .eq('id', reportId)
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return null
  }

  return data
}
