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

  // Build date range for the last 6 months
  const monthRanges: { monthString: string; firstDay: string; lastDay: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentYear, currentMonth - i, 1)
    monthRanges.push({
      monthString: month.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
      firstDay: month.toISOString().split('T')[0],
      lastDay: new Date(currentYear, currentMonth - i + 1, 0).toISOString().split('T')[0],
    })
  }

  const firstRange = monthRanges[monthRanges.length - 1]
  const lastRange = monthRanges[0]

  // Single query: fetch all approved deposits in the 6-month window
  const { data: allDeposits } = await supabase
    .from('deposits')
    .select('amount, deposit_date')
    .eq('status', 'approved')
    .gte('deposit_date', firstRange.firstDay)
    .lte('deposit_date', lastRange.lastDay)

  // Group deposits by month in memory
  const monthlyTotals = new Map<string, number>()
  ;(allDeposits || []).forEach((d) => {
    const monthKey = new Date(d.deposit_date + 'T00:00:00').toLocaleString('id-ID', {
      month: 'short',
      year: 'numeric',
    })
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + Number(d.amount))
  })

  return monthRanges.map(({ monthString }) => ({
    month: monthString,
    totalDeposits: monthlyTotals.get(monthString) || 0,
    lateDeposits: 0,
    target: MONTHLY_TARGET,
  }))
}

export async function getDriverPerformance(): Promise<DriverPerformance[]> {
  const supabase = createClient()

  // Get all drivers with their profile
  const { data: drivers } = await supabase
    .from('drivers')
    .select(`
      id,
      profile:profiles(full_name)
    `)
    .eq('is_active', true)

  if (!drivers) return []

  // Single query: all approved deposits for all drivers
  const { data: allDeposits } = await supabase
    .from('deposits')
    .select('driver_id, amount')
    .eq('status', 'approved')

  // Single query: all reports for all drivers
  const { data: allReports } = await supabase
    .from('daily_reports')
    .select('driver_id, status, daily_income')

  // Build lookup maps
  const depositMap = new Map<string, number>()
  ;(allDeposits || []).forEach((d) => {
    depositMap.set(d.driver_id, (depositMap.get(d.driver_id) || 0) + Number(d.amount))
  })

  const reportCountMap = new Map<string, number>()
  const incomeCountMap = new Map<string, number>()
  ;(allReports || []).forEach((r) => {
    reportCountMap.set(r.driver_id, (reportCountMap.get(r.driver_id) || 0) + 1)
    if (r.status === 'narik' && Number(r.daily_income) > 0) {
      incomeCountMap.set(r.driver_id, (incomeCountMap.get(r.driver_id) || 0) + 1)
    }
  })

  return drivers
    .map((driver) => ({
      driverId: driver.id,
      driverName: (driver.profile as any)?.full_name || 'Unknown',
      totalDeposits: depositMap.get(driver.id) || 0,
      totalReports: reportCountMap.get(driver.id) || 0,
      reportsWithIncome: incomeCountMap.get(driver.id) || 0,
    }))
    .sort((a, b) => b.totalDeposits - a.totalDeposits)
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

  // Single query: all deposits for this driver
  const { data: allDeposits } = await supabase
    .from('deposits')
    .select('amount, deposit_date')
    .eq('driver_id', driverId)
    .eq('status', 'approved')

  // Single query: all reports for this driver (counting done in JS)
  const { data: allReports } = await supabase
    .from('daily_reports')
    .select('report_date')
    .eq('driver_id', driverId)

  const allDep = allDeposits || []
  const allRep = allReports || []

  const totalDeposits = allDep.reduce((sum, d) => sum + Number(d.amount), 0)
  const monthlyDeposits = allDep
    .filter((d) => d.deposit_date >= firstDayOfMonth)
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const totalReports = allRep.length
  const reportsThisMonth = allRep.filter((r) => r.report_date >= firstDayOfMonth).length

  return { monthlyDeposits, totalDeposits, totalReports, reportsThisMonth }
}
