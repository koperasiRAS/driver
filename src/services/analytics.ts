'use client'

import { createClient } from '@/lib/supabase'
import { DashboardStats, MonthlyData, DriverPerformance } from '@/types'
import { MONTHLY_TARGET } from '@/lib/constants'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient()

  // Get total drivers
  const { count: totalDrivers } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get today's date in Jakarta timezone
  const now = new Date()
  const jakartaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const today = jakartaDate.toISOString().split('T')[0]

  // Get today's reports count
  const { count: todayReports } = await supabase
    .from('daily_reports')
    .select('*', { count: 'exact', head: true })
    .eq('report_date', today)

  // Get pending deposits
  const { count: pendingDeposits } = await supabase
    .from('deposits')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get monthly approved deposits
  const firstDayOfMonth = new Date(jakartaDate.getFullYear(), jakartaDate.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount')
    .eq('status', 'approved')
    .gte('deposit_date', firstDayOfMonth)

  const monthlyDeposits = (deposits || []).reduce(
    (sum, deposit) => sum + Number(deposit.amount),
    0
  )

  return {
    totalDrivers: totalDrivers || 0,
    todayReports: todayReports || 0,
    pendingDeposits: pendingDeposits || 0,
    monthlyDeposits,
    monthlyTarget: MONTHLY_TARGET,
  }
}

export async function getMonthlyData(): Promise<MonthlyData[]> {
  const supabase = createClient()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const monthlyData: MonthlyData[] = []

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentYear, currentMonth - i, 1)
    const monthString = month.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
    const firstDay = month.toISOString().split('T')[0]
    const lastDay = new Date(currentYear, currentMonth - i + 1, 0).toISOString().split('T')[0]

    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('status', 'approved')
      .gte('deposit_date', firstDay)
      .lte('deposit_date', lastDay)

    const totalDeposits = (deposits || []).reduce(
      (sum, deposit) => sum + Number(deposit.amount),
      0
    )

    monthlyData.push({
      month: monthString,
      totalDeposits,
      target: MONTHLY_TARGET,
    })
  }

  return monthlyData
}

export async function getDriverPerformance(): Promise<DriverPerformance[]> {
  const supabase = createClient()

  // Get all drivers
  const { data: drivers } = await supabase
    .from('drivers')
    .select(`
      id,
      profile:profiles(full_name)
    `)
    .eq('is_active', true)

  if (!drivers) return []

  const performance: DriverPerformance[] = []

  for (const driver of drivers) {
    // Get deposits
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('driver_id', driver.id)
      .eq('status', 'approved')

    const totalDeposits = (deposits || []).reduce(
      (sum, deposit) => sum + Number(deposit.amount),
      0
    )

    // Get reports
    const { count: totalReports } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driver.id)

    // Get reports with income
    const { count: reportsWithIncome } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driver.id)
      .eq('status', 'narik')
      .gt('daily_income', 0)

    performance.push({
      driverId: driver.id,
      driverName: (driver.profile as any)?.full_name || 'Unknown',
      totalDeposits,
      totalReports: totalReports || 0,
      reportsWithIncome: reportsWithIncome || 0,
    })
  }

  return performance.sort((a, b) => b.totalDeposits - a.totalDeposits)
}

export async function getDriverStats(driverId: string): Promise<{
  monthlyDeposits: number
  totalDeposits: number
  totalReports: number
  reportsThisMonth: number
}> {
  const supabase = createClient()
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]

  // Get all deposits
  const { data: allDeposits } = await supabase
    .from('deposits')
    .select('amount, deposit_date')
    .eq('driver_id', driverId)
    .eq('status', 'approved')

  const totalDeposits = (allDeposits || []).reduce(
    (sum, deposit) => sum + Number(deposit.amount),
    0
  )

  const monthlyDeposits = (allDeposits || [])
    .filter((d) => d.deposit_date >= firstDayOfMonth)
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0)

  // Get all reports
  const { count: totalReports } = await supabase
    .from('daily_reports')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', driverId)

  // Get this month's reports
  const { count: reportsThisMonth } = await supabase
    .from('daily_reports')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', driverId)
    .gte('report_date', firstDayOfMonth)

  return {
    monthlyDeposits,
    totalDeposits,
    totalReports: totalReports || 0,
    reportsThisMonth: reportsThisMonth || 0,
  }
}
