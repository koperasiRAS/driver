'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/common/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MONTHLY_TARGET } from '@/lib/constants'
import { createClient } from '@/lib/supabase'
import { MonthlyData, DriverPerformance, WeeklyReport, MonthlyReport, AuditLog } from '@/types'

export default function OwnerAnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [performance, setPerformance] = useState<DriverPerformance[]>([])
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyReportsList, setMonthlyReportsList] = useState<MonthlyReport[]>([])
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'monthly' | 'logs'>('overview')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Get monthly data
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const monthlyArr: MonthlyData[] = []

        for (let i = 5; i >= 0; i--) {
          const month = new Date(currentYear, currentMonth - i, 1)
          const monthStr = month.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
          const firstDay = month.toISOString().split('T')[0]
          const lastDay = new Date(currentYear, currentMonth - i + 1, 0).toISOString().split('T')[0]

          try {
            const { data: deposits } = await supabase
              .from('deposits')
              .select('amount')
              .eq('status', 'approved')
              .gte('deposit_date', firstDay)
              .lte('deposit_date', lastDay)

            const totalDeposits = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0)
            monthlyArr.push({ month: monthStr, totalDeposits, target: MONTHLY_TARGET })
          } catch (e) {
            monthlyArr.push({ month: monthStr, totalDeposits: 0, target: MONTHLY_TARGET })
          }
        }
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
              } catch (e) {
                // Skip this driver if error
              }
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
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 10000)

    fetchData()

    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  const maxDeposit = Math.max(...(monthlyData || []).map(d => d.totalDeposits), MONTHLY_TARGET)

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'INSERT': 'Menambahkan',
      'UPDATE': 'Mengubah',
      'DELETE': 'Menghapus',
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'CREATE': 'Membuat',
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
                  {(monthlyData || []).map((data, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-300">{data.month}</span>
                        <span className="font-medium">
                          {formatCurrency(data.totalDeposits)} / {formatCurrency(data.target)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-6">
                        <div
                          className="bg-teal-600 rounded-sm"
                          style={{ width: `${Math.min((data.totalDeposits / maxDeposit) * 100, 100)}%` }}
                        />
                        <div
                          className="bg-slate-200 dark:bg-slate-700 rounded-sm"
                          style={{ width: `${Math.min((data.target / maxDeposit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-teal-600 rounded-sm" />
                    <span className="text-slate-500">Realisasi</span>
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
    </div>
  )
}
