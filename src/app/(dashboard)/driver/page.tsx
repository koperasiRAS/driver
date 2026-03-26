'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/common/loading-spinner'
import { Target, FileText, TrendingUp, DollarSign, CheckCircle2, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Driver, DailyReport } from '@/types'
import { formatCurrency, getTodayDateString, formatTime } from '@/lib/utils'
import { DAILY_TARGET, MONTHLY_TARGET } from '@/lib/constants'

export default function DriverDashboard() {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [todayReports, setTodayReports] = useState<DailyReport[]>([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [todayExpenses, setTodayExpenses] = useState(0)
  const [monthlyDeposits, setMonthlyDeposits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isCurrentMonthSettled, setIsCurrentMonthSettled] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select(`*, profile:profiles(*)`)
        .eq('user_id', user.id)
        .single()

      if (driverData) {
        setDriver(driverData)
        const today = getTodayDateString()

        const { data: reports } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('driver_id', driverData.id)
          .eq('report_date', today)
          .order('submitted_at', { ascending: false })

        const reps = reports || []
        setTodayReports(reps)
        const total = reps
          .filter((r) => r.status === 'narik')
          .reduce((sum, r) => sum + Number(r.daily_income || 0), 0)
        setTodayTotal(total)

        try {
          const { data: expenses } = await supabase
            .from('driver_expenses')
            .select('amount')
            .eq('driver_id', driverData.id)
            .eq('expense_date', today)

          const expTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)
          setTodayExpenses(expTotal)
        } catch { /* table may not exist yet */ }

        const firstDayOfMonth = new Date()
        firstDayOfMonth.setDate(1)
        const { data: deposits } = await supabase
          .from('deposits')
          .select('amount')
          .eq('driver_id', driverData.id)
          .eq('status', 'approved')
          .gte('deposit_date', firstDayOfMonth.toISOString().split('T')[0])

        const depTotal = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0)
        setMonthlyDeposits(depTotal)

        try {
          const now = new Date()
          const { data: settlement } = await supabase
            .from('monthly_settlements')
            .select('id')
            .eq('settled_year', now.getFullYear())
            .eq('settled_month', now.getMonth() + 1)
            .single()
          setIsCurrentMonthSettled(!!settlement)
        } catch {
          setIsCurrentMonthSettled(false)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <LoadingPage />

  const surplus = todayTotal - DAILY_TARGET - todayExpenses
  const saldo = todayTotal - todayExpenses
  const targetReached = todayTotal >= DAILY_TARGET
  const progressPct = Math.min(Math.round((monthlyDeposits / MONTHLY_TARGET) * 100), 100)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Selamat datang, {driver?.profile?.full_name}</p>
      </div>

      {/* Daily Income Summary */}
      <Card className={targetReached ? 'border-emerald-300 dark:border-emerald-700' : ''}>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
              Keuangan Hari Ini
            </h3>
            {targetReached && (
              <Badge variant="success" className="flex items-center gap-1 text-[10px] sm:text-xs">
                <CheckCircle2 className="w-3 h-3" />
                Target Tercapai
              </Badge>
            )}
          </div>

          {/* 4-col grid: 1 on mobile, 2 on sm, 4 on md */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* Pendapatan */}
            <div className="text-center p-2.5 sm:p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
              <p className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-medium leading-tight">Pendapatan</p>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-teal-700 dark:text-teal-300 mt-0.5 sm:mt-1 truncate">{formatCurrency(todayTotal)}</p>
              <p className="text-[10px] sm:text-xs text-teal-500 mt-0.5 sm:mt-1">{todayReports.filter(r => r.status === 'narik').length} order</p>
            </div>
            {/* Target Setoran */}
            <div className="text-center p-2.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">Target</p>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white mt-0.5 sm:mt-1 truncate">{formatCurrency(DAILY_TARGET)}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">per hari</p>
            </div>
            {/* Pengeluaran */}
            <div className="text-center p-2.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium leading-tight">Pengeluaran</p>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-1 truncate">{formatCurrency(todayExpenses)}</p>
              <p className="text-[10px] sm:text-xs text-amber-500 mt-0.5 sm:mt-1">hari ini</p>
            </div>
            {/* Kantong / Kurang */}
            <div className={`text-center p-2.5 sm:p-4 rounded-xl border ${surplus >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
              <p className={`text-[10px] sm:text-xs font-medium leading-tight ${surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {surplus >= 0 ? 'Kantong' : 'Kurang'}
              </p>
              <p className={`text-sm sm:text-lg md:text-xl font-bold mt-0.5 sm:mt-1 truncate ${surplus >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {formatCurrency(Math.abs(surplus))}
              </p>
              <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${surplus >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {surplus >= 0 ? 'sisa' : 'belum'}
              </p>
            </div>
          </div>

          {/* Saldo Card */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">Saldo Hari Ini</p>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">{formatCurrency(todayTotal)} - {formatCurrency(todayExpenses)}</p>
              </div>
            </div>
            <p className={`text-lg sm:text-xl font-bold shrink-0 ${saldo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-3">
            <div
              className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${targetReached ? 'bg-emerald-500' : 'bg-teal-600'}`}
              style={{ width: `${Math.min((todayTotal / DAILY_TARGET) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            {Math.round((todayTotal / DAILY_TARGET) * 100)}% dari target harian
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 mx-auto mb-1.5 sm:mb-2" />
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">Tambah Laporan</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Catat pendapatan</p>
              <a href="/driver/report" className="inline-flex items-center justify-center font-medium rounded-md bg-teal-700 text-white hover:bg-teal-800 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm w-full">
                Isi Laporan
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mx-auto mb-1.5 sm:mb-2" />
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">Catat Pengeluaran</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">BBM, makan, dll</p>
              <a href="/driver/expenses" className="inline-flex items-center justify-center font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm w-full">
                Tambah
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Progres Bulanan</CardTitle>
            {isCurrentMonthSettled && (
              <Badge variant="success" className="flex items-center gap-1 text-[10px] sm:text-xs shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Lunas
              </Badge>
            )}
          </div>
          <Target className="w-4 h-4 text-slate-400 shrink-0" />
        </CardHeader>
        <CardContent>
          <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">{progressPct}%</p>
          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 sm:h-2">
            <div className="bg-teal-600 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 truncate">
            {formatCurrency(monthlyDeposits)} / {formatCurrency(MONTHLY_TARGET)}
          </p>
        </CardContent>
      </Card>

      {/* Today's Reports */}
      {todayReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Laporan Hari Ini ({todayReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {todayReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Badge variant={report.status === 'narik' ? 'success' : 'default'} className="text-[10px] sm:text-xs shrink-0">
                      {report.status === 'narik' ? 'NARIK' : 'TIDAK'}
                    </Badge>
                    <span className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">
                      {formatTime(report.submitted_at)}
                    </span>
                  </div>
                  {report.status === 'narik' && (
                    <span className="font-semibold text-teal-600 text-xs sm:text-sm shrink-0 truncate">
                      {formatCurrency(Number(report.daily_income || 0))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
