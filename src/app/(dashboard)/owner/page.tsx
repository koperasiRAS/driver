'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingPage } from '@/components/common/loading-spinner'
import { Users, FileText, DollarSign, Target, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { MONTHLY_TARGET } from '@/lib/constants'
import { DashboardStats } from '@/types'

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchStats = async () => {
      try {
        const now = new Date()
        const jakartaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
        const today = jakartaDate.toISOString().split('T')[0]
        const firstDayOfMonth = new Date(jakartaDate.getFullYear(), jakartaDate.getMonth(), 1)
          .toISOString()
          .split('T')[0]

        let totalDrivers = 0
        let todayReports = 0
        let pendingDeposits = 0
        let monthlyDeposits = 0

        try {
          const { count: td } = await supabase
            .from('drivers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
          totalDrivers = td || 0
        } catch (e) { /* ignore */ }

        try {
          const { count: tr } = await supabase
            .from('daily_reports')
            .select('*', { count: 'exact', head: true })
            .eq('report_date', today)
          todayReports = tr || 0
        } catch (e) { /* ignore */ }

        try {
          const { count: pd } = await supabase
            .from('deposits')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
          pendingDeposits = pd || 0
        } catch (e) { /* ignore */ }

        try {
          const { data: deposits } = await supabase
            .from('deposits')
            .select('amount')
            .eq('status', 'approved')
            .gte('deposit_date', firstDayOfMonth)

          monthlyDeposits = (deposits || []).reduce(
            (sum, deposit) => sum + Number(deposit.amount),
            0
          )
        } catch (e) { /* ignore */ }

        setStats({
          totalDrivers,
          todayReports,
          pendingDeposits,
          monthlyDeposits,
          monthlyTarget: MONTHLY_TARGET,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats({
          totalDrivers: 0,
          todayReports: 0,
          pendingDeposits: 0,
          monthlyDeposits: 0,
          monthlyTarget: MONTHLY_TARGET,
        })
      } finally {
        setLoading(false)
      }
    }

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 10000)

    fetchStats()

    // Real-time subscriptions for dashboard stats
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchStats())
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading || !stats) {
    return <LoadingPage />
  }

  const progressPercentage = Math.min(
    Math.round((stats.monthlyDeposits / stats.monthlyTarget) * 100),
    100
  )

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan manajemen driver</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="text-xs text-slate-400">Laporan masuk hari ini</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Setoran Menunggu</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingDeposits}</div>
            <p className="text-xs text-slate-400">Menunggu persetujuan</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Progres Bulanan</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{progressPercentage}%</div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {formatCurrency(stats.monthlyDeposits)} / {formatCurrency(stats.monthlyTarget)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Target Setoran Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Progres</span>
                  <span className="font-medium">{formatCurrency(stats.monthlyDeposits)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Target: {formatCurrency(MONTHLY_TARGET)} per bulan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/owner/drivers"
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
                <p className="text-sm font-medium dark:text-white">Kelola Driver</p>
              </a>
              <a
                href="/owner/reports"
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
                <p className="text-sm font-medium dark:text-white">Lihat Laporan</p>
              </a>
              <a
                href="/owner/deposits"
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
                <p className="text-sm font-medium dark:text-white">Setorkan Dana</p>
              </a>
              <a
                href="/owner/analytics"
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Target className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
                <p className="text-sm font-medium dark:text-white">Lihat Analitik</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
