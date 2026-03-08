'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/common/loading-spinner'
import { Users, FileText, DollarSign, Target, TrendingUp, Truck, ChevronDown, Clock, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatTime, getTodayDateString } from '@/lib/utils'
import { DAILY_TARGET, MONTHLY_TARGET } from '@/lib/constants'
import { DashboardStats, DailyReport } from '@/types'

interface DriverInfo {
  id: string
  vehicle_plate: string
  profile: { full_name: string; email: string }
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

  useEffect(() => {
    const supabase = createClient()

    const fetchStats = async () => {
      try {
        const today = getTodayDateString()
        const now = new Date()
        const jakartaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
        const firstDayOfMonth = new Date(jakartaDate.getFullYear(), jakartaDate.getMonth(), 1)
          .toISOString()
          .split('T')[0]

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
          const { data: deposits } = await supabase.from('deposits').select('amount').eq('status', 'approved').gte('deposit_date', firstDayOfMonth)
          monthlyDeposits = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0)
        } catch { /* */ }

        setStats({ totalDrivers, todayReports, pendingDeposits, monthlyDeposits, monthlyTarget: MONTHLY_TARGET })
      } catch {
        setStats({ totalDrivers: 0, todayReports: 0, pendingDeposits: 0, monthlyDeposits: 0, monthlyTarget: MONTHLY_TARGET })
      } finally {
        setLoading(false)
      }
    }

    // Fetch driver list
    const fetchDrivers = async () => {
      try {
        const { data } = await supabase.from('drivers').select('id, vehicle_plate, profile:profiles(full_name, email)').eq('is_active', true).order('created_at')
        if (data) setDrivers(data as unknown as DriverInfo[])
      } catch { /* */ }
    }

    const timeout = setTimeout(() => setLoading(false), 10000)
    fetchStats()
    fetchDrivers()

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => { fetchStats(); fetchDrivers() })
      .subscribe()

    return () => { clearTimeout(timeout); supabase.removeChannel(channel) }
  }, [])

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
      const today = getTodayDateString()

      // Reports
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('driver_id', selectedDriverId)
        .eq('report_date', today)
        .order('submitted_at', { ascending: false })

      const reps = reports || []
      setDriverReports(reps)
      const income = reps.filter(r => r.status === 'narik').reduce((sum, r) => sum + Number(r.daily_income || 0), 0)
      const orders = reps.filter(r => r.status === 'narik').reduce((sum, r) => sum + Number(r.number_of_orders || 0), 0)
      setDriverIncome(income)
      setDriverOrders(orders)

      // Expenses
      try {
        const { data: expenses } = await supabase.from('driver_expenses').select('amount').eq('driver_id', selectedDriverId).eq('expense_date', today)
        setDriverExpenses((expenses || []).reduce((sum, e) => sum + Number(e.amount), 0))
      } catch { setDriverExpenses(0) }

      setLoadingDriver(false)
    }

    fetchDriverData()
  }, [selectedDriverId])

  if (loading || !stats) {
    return <LoadingPage />
  }

  const progressPercentage = Math.min(Math.round((stats.monthlyDeposits / stats.monthlyTarget) * 100), 100)
  const driverSurplus = driverIncome - DAILY_TARGET - driverExpenses
  const driverTargetReached = driverIncome >= DAILY_TARGET

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan manajemen driver</p>
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
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Setoran Bulanan</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{progressPercentage}%</div>
            <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-teal-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{formatCurrency(stats.monthlyDeposits)} / {formatCurrency(stats.monthlyTarget)}</p>
          </CardContent>
        </Card>
      </div>

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
              <p className="text-sm">Pilih driver untuk melihat pendapatan hari ini</p>
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
                  <p className="text-xs text-slate-400 mt-0.5">hari ini</p>
                </div>
                <div className={`text-center p-3 rounded-lg border ${
                  driverSurplus >= 0 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                }`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {driverSurplus >= 0 ? 'Kantong Pribadi 💰' : 'Kurang Target'}
                  </p>
                  <p className={`text-lg font-bold ${driverSurplus >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(driverSurplus))}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{driverSurplus >= 0 ? 'sisa bersih' : 'belum tercapai'}</p>
                </div>
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
                    Laporan Hari Ini ({driverReports.length})
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
                <p className="text-center text-sm text-slate-400 py-4">Driver belum mengirim laporan hari ini</p>
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
