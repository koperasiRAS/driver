'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/common/loading-spinner'
import { Users, FileText, DollarSign, Target, TrendingUp, Truck, ChevronDown, Clock, AlertTriangle, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatTime, getTodayDateString } from '@/lib/utils'
import { DAILY_TARGET, MONTHLY_TARGET } from '@/lib/constants'
import { DashboardStats, DailyReport } from '@/types'

interface DriverInfo {
  id: string
  vehicle_plate: string
  profile: { full_name: string; email: string }
}

interface DriverDepositInfo {
  driverId: string
  driverName: string
  vehiclePlate: string
  monthlyDeposit: number
  target: number
  percentage: number
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Driver monitoring
  const [drivers, setDrivers] = useState<DriverInfo[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all')
  const [driverReports, setDriverReports] = useState<DailyReport[]>([])
  const [driverIncome, setDriverIncome] = useState(0)
  const [driverExpenses, setDriverExpenses] = useState(0)
  const [driverOrders, setDriverOrders] = useState(0)
  const [loadingDriver, setLoadingDriver] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [driverDeposits, setDriverDeposits] = useState<DriverDepositInfo[]>([])
  const [currentSettlement, setCurrentSettlement] = useState<{ settled_at: string } | null>(null)

  // Filter state
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)

  const MONTHS = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
  ]

  const YEARS = [0, 1, 2, 3, 4].map(i => new Date().getFullYear() - i)

  useEffect(() => {
    const supabase = createClient()

    const fetchAll = async () => {
      // Reset stale data immediately so previous month's data doesn't show during re-fetch
      setDriverDeposits([])
      setDriverReports([])
      setDriverIncome(0)
      setDriverExpenses(0)
      setDriverOrders(0)

      const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

      // 1. Check if selected month is settled
      let settledAt: string | null = null
      let settlementTotalAmount = 0
      try {
        const { data: settlement } = await supabase
          .from('monthly_settlements')
          .select('settled_at, total_amount')
          .eq('settled_year', selectedYear)
          .eq('settled_month', selectedMonth)
          .single()
        settledAt = settlement?.settled_at || null
        settlementTotalAmount = Number(settlement?.total_amount || 0)
        setCurrentSettlement(settlement || null)
      } catch {
        setCurrentSettlement(null)
      }

      // 2. Fetch stats
      try {
        const today = getTodayDateString()
        let totalDrivers = 0, todayReports = 0, pendingDeposits = 0, monthlyDeposits = 0

        try {
          const { count } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_active', true)
          totalDrivers = count || 0
        } catch { /* */ }

        try {
          const { count } = await supabase.from('daily_reports').select('*', { count: 'exact', head: true }).eq('report_date', today)
          todayReports = count || 0
        } catch { /* */ }

        try {
          const { count } = await supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending')
          pendingDeposits = count || 0
        } catch { /* */ }

        try {
          if (settledAt) {
            // Bulan LUNAS — gunakan nominal dari settlement
            monthlyDeposits = settlementTotalAmount
          } else {
            // Belum settle — query live deposits
            let depositsQuery = supabase.from('deposits').select('amount').eq('status', 'approved').gte('deposit_date', firstDayOfMonth).lte('deposit_date', lastDayOfMonth)
            const { data: deposits } = await depositsQuery
            monthlyDeposits = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0)
          }
        } catch { /* */ }

        setStats({ totalDrivers, todayReports, pendingDeposits, monthlyDeposits, monthlyTarget: MONTHLY_TARGET })
      } catch {
        setStats({ totalDrivers: 0, todayReports: 0, pendingDeposits: 0, monthlyDeposits: 0, monthlyTarget: MONTHLY_TARGET })
      }

      // 3. Fetch drivers + all deposits in ONE query (fixes N+1)
      try {
        const { data } = await supabase.from('drivers').select('id, vehicle_plate, profile:profiles(full_name, email)').eq('is_active', true).order('created_at')
        if (data) {
          const driverList = data as unknown as DriverInfo[]
          setDrivers(driverList)

          // Single query: fetch all deposits for the month across ALL drivers
          let allDepositsQuery = supabase
            .from('deposits')
            .select('driver_id, amount, reviewed_at')
            .eq('status', 'approved')
            .gte('deposit_date', firstDayOfMonth)
            .lte('deposit_date', lastDayOfMonth)

          if (settledAt) {
            allDepositsQuery = allDepositsQuery.lt('reviewed_at', settledAt)
          }

          const { data: allDeposits } = await allDepositsQuery

          // Group deposits by driver_id in memory (no extra queries)
          const depositMap = new Map<string, number>()
          ;(allDeposits || []).forEach((dep: { driver_id: string; amount: number }) => {
            const existing = depositMap.get(dep.driver_id) || 0
            depositMap.set(dep.driver_id, existing + Number(dep.amount))
          })

          // Build driver deposit info from the grouped data
          const results = driverList.map((d) => {
            const total = depositMap.get(d.id) || 0
            const pct = Math.round((total / MONTHLY_TARGET) * 100)
            return {
              driverId: d.id,
              driverName: d.profile?.full_name || 'Driver',
              vehiclePlate: d.vehicle_plate || '-',
              monthlyDeposit: total,
              target: MONTHLY_TARGET,
              percentage: pct,
            }
          })

          setDriverDeposits(results)
        }
      } catch { /* */ }

      setLoading(false)
    }

    const timeout = setTimeout(() => setLoading(false), 10000)
    fetchAll()

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_settlements' }, () => fetchAll())
      .subscribe()

    return () => { clearTimeout(timeout); supabase.removeChannel(channel) }
  }, [selectedYear, selectedMonth])

  // Fetch selected driver data
  useEffect(() => {
    if (selectedDriverId === 'all' || !selectedDriverId) {
      setDriverReports([])
      setDriverIncome(0)
      setDriverExpenses(0)
      setDriverOrders(0)
      return
    }

    const fetchDriverData = async () => {
      setLoadingDriver(true)
      const supabase = createClient()

      // Build date range from selected filter
      const selectedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

      // Reports for selected month
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('driver_id', selectedDriverId)
        .gte('report_date', selectedDate)
        .lte('report_date', lastDayOfMonth)
        .order('submitted_at', { ascending: false })

      const reps = reports || []
      setDriverReports(reps)
      const income = reps.filter(r => r.status === 'narik').reduce((sum, r) => sum + Number(r.daily_income || 0), 0)
      const orders = reps.filter(r => r.status === 'narik').reduce((sum, r) => sum + Number(r.number_of_orders || 0), 0)
      setDriverIncome(income)
      setDriverOrders(orders)

      // Expenses for selected month
      try {
        const { data: expenses } = await supabase.from('driver_expenses').select('amount').eq('driver_id', selectedDriverId).gte('expense_date', selectedDate).lte('expense_date', lastDayOfMonth)
        setDriverExpenses((expenses || []).reduce((sum, e) => sum + Number(e.amount), 0))
      } catch { setDriverExpenses(0) }

      setLoadingDriver(false)
    }

    fetchDriverData()
  }, [selectedDriverId, selectedYear, selectedMonth])

  if (loading || !stats) {
    return <LoadingPage />
  }

  const totalTarget = MONTHLY_TARGET * Math.max(stats.totalDrivers, 1)
  const progressPercentage = totalTarget > 0 ? Math.min(Math.round((stats.monthlyDeposits / totalTarget) * 100), 100) : 0
  const driverSurplus = driverIncome - DAILY_TARGET - driverExpenses
  const driverSaldo = driverIncome - driverExpenses
  const driverTargetReached = driverIncome >= DAILY_TARGET
  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''
  const currentMonthLabel = `${selectedMonthLabel} ${selectedYear}`

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan manajemen driver</p>
        </div>
        {/* Filter Bulan/Tahun */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Driver</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalDrivers}</div>
            <p className="text-xs text-slate-400">Driver aktif</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Laporan Hari Ini</CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.todayReports}</div>
            <p className="text-xs text-slate-400">Laporan masuk</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Setoran Pending</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingDeposits}</div>
            <p className="text-xs text-slate-400">Menunggu approval</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Setoran Bulanan</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full">{currentMonthLabel}</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.monthlyDeposits)}</div>
            <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-teal-600'}`} style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{progressPercentage}% dari {formatCurrency(totalTarget)} ({stats.totalDrivers} driver)</p>
          </CardContent>
        </Card>
      </div>

      {/* ====== PER-DRIVER DEPOSIT MONITORING ====== */}
      {driverDeposits.length > 0 && driverDeposits.some(dd => dd.monthlyDeposit > 0) ? (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-teal-600" />
              Monitoring Setoran Per Driver
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full ml-1">{currentMonthLabel}</span>
              <Badge variant="default" className="ml-auto text-xs">
                Target: {formatCurrency(MONTHLY_TARGET)}/driver/bulan
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driverDeposits.map((dd) => {
                const isWarning = dd.percentage < 50
                const isDanger = dd.percentage < 25
                const isComplete = dd.percentage >= 100
                return (
                  <button
                    key={dd.driverId}
                    onClick={() => setSelectedDriverId(dd.driverId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-sm ${
                      isDanger
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        : isWarning
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                        : isComplete
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    {/* Warning icon */}
                    {isDanger && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
                    {isWarning && !isDanger && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                    {isComplete && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}

                    {/* Driver info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{dd.driverName}</p>
                        <span className="text-xs text-slate-400">({dd.vehiclePlate})</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : isComplete ? 'bg-emerald-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(dd.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatCurrency(dd.monthlyDeposit)} / {formatCurrency(MONTHLY_TARGET)}
                      </p>
                    </div>

                    {/* Percentage */}
                    <Badge
                      variant={isDanger ? 'danger' : isWarning ? 'warning' : isComplete ? 'success' : 'default'}
                      className="shrink-0 text-xs"
                    >
                      {dd.percentage}%
                    </Badge>
                  </button>
                )
              })}

              {/* Summary warning */}
              {driverDeposits.some(dd => dd.percentage < 50) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      {driverDeposits.filter(dd => dd.percentage < 50).length} driver belum mencapai 50% target bulan ini
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Klik driver di atas untuk melihat detail pendapatan harian
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-teal-600" />
              Monitoring Setoran Per Driver
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-full ml-1">{currentMonthLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada setoran di bulan {currentMonthLabel}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== DRIVER MONITORING SECTION ====== */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-600" />
              Pantau Pendapatan Driver
            </CardTitle>
            <div className="relative">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full sm:w-64 appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 pr-10 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
              >
                <option value="all">-- Pilih Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profile?.full_name || 'Driver'} ({d.vehicle_plate})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedDriverId === 'all' ? (
            <div className="text-center py-8 text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Pilih driver untuk melihat pendapatan bulan {currentMonthLabel}</p>
            </div>
          ) : loadingDriver ? (
            <div className="text-center py-8 text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Memuat data driver...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Financial Cards — same layout as driver dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Pendapatan</p>
                  <p className={`text-lg font-bold ${driverTargetReached ? 'text-emerald-600' : 'text-teal-700 dark:text-teal-300'}`}>
                    {formatCurrency(driverIncome)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{driverOrders} order</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Setoran</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(DAILY_TARGET)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">per hari</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pengeluaran</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(driverExpenses)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{currentMonthLabel}</p>
                </div>
                <div className={`text-center p-3 rounded-lg border ${
                  driverSurplus >= 0 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                }`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {driverSurplus >= 0 ? 'Kantong Pribadi' : 'Kurang Target'}
                  </p>
                  <p className={`text-lg font-bold ${driverSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(driverSurplus))}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{driverSurplus >= 0 ? 'sisa bersih' : 'belum tercapai'}</p>
                </div>
              </div>

              {/* Saldo Card — horizontal full width */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Saldo Hari Ini</p>
                    <p className="text-xs text-slate-400">{formatCurrency(driverIncome)} - {formatCurrency(driverExpenses)}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${driverSaldo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'}`}>
                  {formatCurrency(driverSaldo)}
                </p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${driverTargetReached ? 'bg-emerald-500' : 'bg-teal-600'}`}
                    style={{ width: `${Math.min((driverIncome / DAILY_TARGET) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">{Math.round((driverIncome / DAILY_TARGET) * 100)}% dari target harian</p>
              </div>

              {/* Today's Reports */}
              {driverReports.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Laporan {currentMonthLabel} ({driverReports.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {driverReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          {report.photo_url && (
                            <button onClick={() => setPreviewImage(report.photo_url!)} className="shrink-0">
                              <img src={report.photo_url} alt="Bukti" className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-600 hover:opacity-80 transition" />
                            </button>
                          )}
                          <div>
                            <Badge variant={report.status === 'narik' ? 'success' : 'warning'} className="text-xs">
                              {report.status === 'narik' ? 'NARIK' : 'TIDAK NARIK'}
                            </Badge>
                            <p className="text-xs text-slate-400 mt-0.5">{formatTime(report.submitted_at)}</p>
                          </div>
                        </div>
                        {report.status === 'narik' && (
                          <div className="text-right">
                            <p className="font-semibold text-teal-600 dark:text-teal-400 text-sm">{formatCurrency(report.daily_income || 0)}</p>
                            <p className="text-xs text-slate-400">{report.number_of_orders} order</p>
                          </div>
                        )}
                        {report.status === 'tidak_narik' && (
                          <p className="text-xs text-slate-400">{report.reason || '-'}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {driverReports.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">Belum ada laporan di bulan {currentMonthLabel}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/owner/drivers" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-sm font-medium dark:text-white">Kelola Driver</p>
            </a>
            <a href="/owner/reports" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-sm font-medium dark:text-white">Lihat Laporan</p>
            </a>
            <a href="/owner/deposits" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
              <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-sm font-medium dark:text-white">Setoran</p>
            </a>
            <a href="/owner/analytics" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
              <Target className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-sm font-medium dark:text-white">Analitik</p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Photo Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30">
            ✕
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
