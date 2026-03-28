'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/common/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MONTHLY_TARGET } from '@/lib/constants'
import { createClient } from '@/lib/supabase'
import { MonthlyData, DriverPerformance, WeeklyReport, MonthlyReport, AuditLog, MonthlySettlement } from '@/types'
import { createSettlementAction } from '@/app/actions/settlement'

export default function OwnerAnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [performance, setPerformance] = useState<DriverPerformance[]>([])
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyReportsList, setMonthlyReportsList] = useState<MonthlyReport[]>([])
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'monthly' | 'logs'>('overview')

  // Setor ke BOS state
  const [currentSettlement, setCurrentSettlement] = useState<MonthlySettlement | null>(null)
  const [showSettleDialog, setShowSettleDialog] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [settleError, setSettleError] = useState<string | null>(null)
  const [lateDepositsAmount, setLateDepositsAmount] = useState(0)
  const [lateDepositsMonth, setLateDepositsMonth] = useState<string | null>(null)

  // Initial fetch + timeout guard
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 10000)

    async function load() {
      try {
        const supabase = createClient()

        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()

        // Build 6-month window
        const monthWindows = []
        for (let i = 5; i >= 0; i--) {
          const month = new Date(currentYear, currentMonth - i, 1)
          const year = month.getFullYear()
          const monthNum = month.getMonth() + 1
          const firstDay = new Date(year, month.getMonth(), 1)
          const lastDay = new Date(year, month.getMonth() + 1, 0)
          monthWindows.push({
            year,
            month: monthNum,
            monthStr: month.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
            firstDay: firstDay.toISOString().split('T')[0],
            lastDay: lastDay.toISOString().split('T')[0],
          })
        }

        // 1. Fetch all settlements for 6-month window (single query)
        const settlementMap: Record<string, MonthlySettlement> = {}
        try {
          const settlementYearMonths = monthWindows.map(w => `(${w.year},${w.month})`).join(',')
          const { data: settlements } = await supabase
            .from('monthly_settlements')
            .select('*')
            .or(`(settled_year,settled_month).in.(${settlementYearMonths})`)
          ;(settlements || []).forEach(s => {
            settlementMap[`${s.settled_year}-${s.settled_month}`] = s
          })
        } catch { /* ignore */ }

        // 2. Fetch ALL approved deposits for 6-month window in ONE query
        const earliestFirst = monthWindows[0].firstDay
        const latestLast = monthWindows[monthWindows.length - 1].lastDay
        const { data: allDeposits } = await supabase
          .from('deposits')
          .select('amount, deposit_date, reviewed_at, created_at')
          .eq('status', 'approved')
          .gte('deposit_date', earliestFirst)
          .lte('deposit_date', latestLast)

        // 3. Group deposits by month in memory
        const depositsByMonth: Record<string, typeof allDeposits> = {}
        for (const w of monthWindows) {
          depositsByMonth[`${w.year}-${w.month}`] = []
        }
        ;(allDeposits || []).forEach((d) => {
          const depDate = new Date(d.deposit_date)
          const key = `${depDate.getFullYear()}-${depDate.getMonth() + 1}`
          if (depositsByMonth[key]) {
            depositsByMonth[key].push(d)
          }
        })

        // 4. Build monthly data: separate settled vs late deposits
        const monthlyArr: MonthlyData[] = monthWindows.map(w => {
          const settlement = settlementMap[`${w.year}-${w.month}`]
          const deposits = depositsByMonth[`${w.year}-${w.month}`] || []

          if (settlement) {
            // Settled month: separate based on when deposit was reviewed
            let settled = 0
            let late = 0
            const settledAt = new Date(settlement.settled_at).getTime()

            for (const d of deposits) {
              const reviewedAt = d.reviewed_at ? new Date(d.reviewed_at).getTime() : new Date(d.created_at).getTime()
              if (reviewedAt <= settledAt) {
                settled += Number(d.amount)
              } else {
                late += Number(d.amount)
              }
            }
            return { month: w.monthStr, totalDeposits: settled, lateDeposits: late, target: MONTHLY_TARGET }
          } else {
            // Not settled: all approved deposits are "on track"
            const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)
            return { month: w.monthStr, totalDeposits, lateDeposits: 0, target: MONTHLY_TARGET }
          }
        })

        setMonthlyData(monthlyArr)

        // Get driver performance
        try {
          const { data: drivers } = await supabase
            .from('drivers')
            .select('id, profile:profiles(full_name)')
            .eq('is_active', true)

          const perf: DriverPerformance[] = []
          if (drivers) {
            for (const driver of drivers) {
              try {
                const { data: deposits } = await supabase
                  .from('deposits')
                  .select('amount')
                  .eq('driver_id', driver.id)
                  .eq('status', 'approved')

                const { count: totalReports } = await supabase
                  .from('daily_reports')
                  .select('*', { count: 'exact', head: true })
                  .eq('driver_id', driver.id)

                const { count: reportsWithIncome } = await supabase
                  .from('daily_reports')
                  .select('*', { count: 'exact', head: true })
                  .eq('driver_id', driver.id)
                  .eq('status', 'narik')
                  .gt('daily_income', 0)

                perf.push({
                  driverId: driver.id,
                  driverName: (driver.profile as any)?.full_name || 'Unknown',
                  totalDeposits: (deposits || []).reduce((s, d) => s + Number(d.amount), 0),
                  totalReports: totalReports || 0,
                  reportsWithIncome: reportsWithIncome || 0,
                })
              } catch (e) { /* skip this driver */ }
            }
          }
          setPerformance(perf.sort((a, b) => b.totalDeposits - a.totalDeposits))
        } catch (e) {
          setPerformance([])
        }

        // Get weekly reports
        try {
          const { data: weekly } = await supabase
            .from('weekly_reports')
            .select('*, driver:drivers(profile:profiles(full_name))')
            .order('week_start', { ascending: false })
            .limit(20)
          setWeeklyReports(weekly || [])
        } catch (e) {
          setWeeklyReports([])
        }

        // Get monthly reports
        try {
          const { data: monthlyRpt } = await supabase
            .from('monthly_reports')
            .select('*, driver:drivers(profile:profiles(full_name))')
            .order('month', { ascending: false })
            .limit(20)
          setMonthlyReportsList(monthlyRpt || [])
        } catch (e) {
          setMonthlyReportsList([])
        }

        // Get activity logs
        try {
          const { data: logs } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
          setActivityLogs(logs || [])
        } catch (e) {
          setActivityLogs([])
        }

        // Get current month's settlement
        try {
          const { data: settlementData } = await supabase
            .from('monthly_settlements')
            .select('*')
            .eq('settled_year', currentYear)
            .eq('settled_month', currentMonth + 1)
            .single()
          setCurrentSettlement(settlementData || null)

          if (settlementData) {
            const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
            const prevFirstDay = prevMonthDate.toISOString().split('T')[0]
            const prevLastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
            const settledAtMs = new Date(settlementData.settled_at).getTime()

            // Fetch all deposits from prev month (including null reviewed_at)
            const { data: prevDeposits } = await supabase
              .from('deposits')
              .select('amount, reviewed_at, created_at')
              .eq('status', 'approved')
              .gte('deposit_date', prevFirstDay)
              .lte('deposit_date', prevLastDay)

            let lateTotal = 0
            ;(prevDeposits || []).forEach((d: { amount: unknown; reviewed_at?: string; created_at: string }) => {
              const reviewedAtMs = d.reviewed_at ? new Date(d.reviewed_at).getTime() : new Date(d.created_at).getTime()
              if (reviewedAtMs > settledAtMs) {
                lateTotal += Number(d.amount)
              }
            })

            setLateDepositsAmount(lateTotal)
            setLateDepositsMonth(prevMonthDate.toLocaleString('id-ID', { month: 'long' }))
          } else {
            setLateDepositsAmount(0)
            setLateDepositsMonth(null)
          }
        } catch {
          setCurrentSettlement(null)
          setLateDepositsAmount(0)
          setLateDepositsMonth(null)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => clearTimeout(timeout)
  }, [])

  // Realtime subscription — update analytics when deposits change
  useEffect(() => {
    const supabase = createClient()

    const loadRealtime = () => {
      supabase
        .from('deposits')
        .select('amount, deposit_date')
        .eq('status', 'approved')
        .then(({ data: deposits }) => {
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()

          const approvedDeposits = (deposits || []).filter(d => {
            const depDate = new Date(d.deposit_date)
            return depDate.getFullYear() === currentYear && depDate.getMonth() === currentMonth
          })
          const total = approvedDeposits.reduce((sum, d) => sum + Number(d.amount), 0)

          setMonthlyData(prev => {
            const updated = [...prev]
            if (updated.length > 0) updated[updated.length - 1] = { ...updated[updated.length - 1], totalDeposits: total }
            return updated
          })
        })

      supabase
        .from('monthly_settlements')
        .select('*')
        .eq('settled_year', new Date().getFullYear())
        .eq('settled_month', new Date().getMonth() + 1)
        .single()
        .then(({ data: settlementData }) => {
          setCurrentSettlement(settlementData || null)
        })
    }

    const channel = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, (payload) => { loadRealtime(); void payload })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_settlements' }, (payload) => { loadRealtime(); void payload })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [])

  const handleSettle = async () => {
    setIsSettling(true)
    setSettleError(null)

    const now = new Date()
    const currentMonthData = monthlyData[monthlyData.length - 1]
    const totalToSettle = (currentMonthData?.totalDeposits || 0) + lateDepositsAmount

    const result = await createSettlementAction({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      totalAmount: totalToSettle,
    })

    setIsSettling(false)

    if (result.success) {
      setShowSettleDialog(false)
      // Refresh settlement data
      const supabase = createClient()
      const { data: updated } = await supabase
        .from('monthly_settlements')
        .select('*')
        .eq('settled_year', now.getFullYear())
        .eq('settled_month', now.getMonth() + 1)
        .single()
      setCurrentSettlement(updated || null)
      setLateDepositsAmount(0)
      setLateDepositsMonth(null)
    } else {
      setSettleError(result.error || 'Gagal menyimpan.')
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  const maxDeposit = Math.max(...(monthlyData || []).map(d => d.totalDeposits + d.lateDeposits), MONTHLY_TARGET)

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'INSERT': 'Menambahkan',
      'UPDATE': 'Mengubah',
      'DELETE': 'Menghapus',
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'CREATE': 'Membuat',
      'SETTLE': 'Menyetor ke BOS',
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analitik & Laporan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Statistik dan laporan lengkap</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {[
          { key: 'overview', label: 'Ringkasan' },
          { key: 'weekly', label: 'Laporan Mingguan' },
          { key: 'monthly', label: 'Laporan Bulanan' },
          { key: 'logs', label: 'Log Aktivitas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === tab.key
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Setoran Bulanan vs Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(monthlyData || []).map((data, idx) => {
                    const settledPct = maxDeposit > 0 ? Math.min((data.totalDeposits / maxDeposit) * 100, 100) : 0
                    const latePct = maxDeposit > 0 ? Math.min((data.lateDeposits / maxDeposit) * 100, 100) : 0
                    const targetPct = maxDeposit > 0 ? Math.min((data.target / maxDeposit) * 100, 100) : 0
                    const grandTotal = data.totalDeposits + data.lateDeposits
                    return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-300">{data.month}</span>
                        <span className="font-medium">
                          {formatCurrency(grandTotal)}
                          {data.lateDeposits > 0 && (
                            <span className="text-amber-500 text-xs ml-1">(+{formatCurrency(data.lateDeposits)} telat)</span>
                          )}
                          {' / '}{formatCurrency(data.target)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-6">
                        <div
                          className="bg-teal-600 rounded-sm"
                          style={{ width: `${settledPct}%` }}
                        />
                        {data.lateDeposits > 0 && (
                          <div
                            className="bg-amber-400 rounded-sm"
                            style={{ width: `${latePct}%` }}
                          />
                        )}
                        <div
                          className="bg-slate-200 dark:bg-slate-700 rounded-sm"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>
                  )
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-teal-600 rounded-sm" />
                    <span className="text-slate-500">Settled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-400 rounded-sm" />
                    <span className="text-slate-500">Telat Disetor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm" />
                    <span className="text-slate-500">Target</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Performa Driver</CardTitle>
              </CardHeader>
              <CardContent>
                {performance.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Belum ada data driver</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-2 text-xs font-medium text-slate-500">Driver</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Setoran</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Laporan</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Hari Kerja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(performance || []).map((perf) => (
                          <tr key={perf.driverId} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 px-2 text-sm font-medium text-slate-800 dark:text-white">
                              {perf.driverName}
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-slate-600 dark:text-slate-300">
                              {formatCurrency(perf.totalDeposits)}
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-slate-600 dark:text-slate-300">
                              {perf.totalReports}
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-slate-600 dark:text-slate-300">
                              {perf.reportsWithIncome}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Setor ke BOS Section */}
          {currentSettlement ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg animate-fade-in">
              <span className="text-2xl text-emerald-600">&#10003;</span>
              <div className="flex-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Bulan Ini — Lunas
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Total disetor: {formatCurrency(currentSettlement.total_amount)}
                  {' · '}
                  {new Date(currentSettlement.settled_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                LUNAS
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in">
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">Setor ke BOS</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total setoran bulan ini:{' '}
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency((monthlyData[monthlyData.length - 1]?.totalDeposits || 0) + lateDepositsAmount)}
                  </span>
                </p>
                {lateDepositsAmount > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ↑ Termasuk {formatCurrency(lateDepositsAmount)} late deposits dari {lateDepositsMonth}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowSettleDialog(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Setor ke BOS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Weekly Reports Tab */}
      {activeTab === 'weekly' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Laporan Mingguan</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyReports.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada laporan mingguan</p>
            ) : (
              <div className="space-y-4">
                {(weeklyReports || []).map((report) => (
                  <div key={report.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {(report.driver as any)?.profile?.full_name || 'Driver'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(report.week_start)} - {formatDate(report.week_end)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-teal-600">{formatCurrency(report.total_income)}</p>
                        <p className="text-xs text-slate-500">{report.total_orders} order</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Reports Tab */}
      {activeTab === 'monthly' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Laporan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyReportsList.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada laporan bulanan</p>
            ) : (
              <div className="space-y-4">
                {(monthlyReportsList || []).map((report) => {
                  const monthStr = new Date(report.month).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
                  return (
                    <div key={report.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {(report.driver as any)?.profile?.full_name || 'Driver'}
                          </p>
                          <p className="text-sm text-slate-500">{monthStr}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-teal-600">{formatCurrency(report.total_income)}</p>
                          <p className="text-xs text-slate-500">{report.working_days} hari kerja</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Total Order</p>
                          <p className="font-medium">{report.total_orders}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total Setoran</p>
                          <p className="font-medium">{formatCurrency(report.total_deposits)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Target Tercapai</p>
                          <p className="font-medium">
                            {report.total_deposits > 0 ? Math.round((report.total_deposits / MONTHLY_TARGET) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Log Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada aktivitas</p>
            ) : (
              <div className="space-y-3">
                {(activityLogs || []).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-teal-500" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-white">
                        {getActionLabel(log.action)} {log.table_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    <Badge variant="default">{log.table_name}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showSettleDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Konfirmasi Setor ke BOS
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Anda akan mencatat setoran bulan ini sebesar:
            </p>
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg mb-4">
              <p className="text-xl font-bold text-teal-700 dark:text-teal-300 text-center">
                {formatCurrency((monthlyData[monthlyData.length - 1]?.totalDeposits || 0) + lateDepositsAmount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
              {lateDepositsAmount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-1">
                  ↑ Termasuk {formatCurrency(lateDepositsAmount)} late deposits
                </p>
              )}
            </div>
            {settleError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{settleError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowSettleDialog(false); setSettleError(null) }}
                disabled={isSettling}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSettle}
                disabled={isSettling}
                className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSettling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan…
                  </>
                ) : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
