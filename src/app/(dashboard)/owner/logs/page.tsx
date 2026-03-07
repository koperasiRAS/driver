'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { ScrollText, Download, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AuditLog } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)

        if (!error && data) {
          setLogs(data)
        }
      } catch (e) {
        console.error('Error fetching logs:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'RESET_PASSWORD': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Buat'
      case 'UPDATE': return 'Update'
      case 'DELETE': return 'Hapus'
      case 'RESET_PASSWORD': return 'Reset Password'
      case 'APPROVE': return 'Setujui'
      case 'REJECT': return 'Tolak'
      default: return action
    }
  }

  const getTableLabel = (table: string) => {
    switch (table) {
      case 'drivers': return 'Driver'
      case 'daily_reports': return 'Laporan'
      case 'deposits': return 'Setoran'
      case 'profiles': return 'Profil'
      case 'auth.users': return 'Akun User'
      default: return table
    }
  }

  const uniqueActions = ['all', ...Array.from(new Set(logs.map(l => l.action)))]

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.table_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAction = actionFilter === 'all' || log.action === actionFilter

    return matchesSearch && matchesAction
  })

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Log Aktivitas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Riwayat semua aktivitas sistem</p>
        </div>
        <button
          onClick={() => {
            const csvData = filteredLogs.map(l => ({
              Waktu: l.created_at,
              Aksi: getActionLabel(l.action),
              Tabel: getTableLabel(l.table_name),
              Detail: JSON.stringify(l.details || {}),
            }))
            exportToCSV(csvData, 'log_aktivitas')
          }}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="Export CSV"
        >
          <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {uniqueActions.map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-3 py-2 text-xs rounded-md transition-colors ${
                actionFilter === action
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {action === 'all' ? 'Semua' : getActionLabel(action)}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ScrollText className="w-16 h-16 text-slate-300 dark:text-slate-600" />}
            title="Belum ada log aktivitas"
            description="Aktivitas sistem akan muncul di sini"
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Aktivitas ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`inline-block px-2 py-1 text-[11px] font-semibold rounded ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {getTableLabel(log.table_name)}
                      </span>
                      {log.details && typeof log.details === 'object' && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {(log.details as Record<string, string>).driver_name ||
                           (log.details as Record<string, string>).email ||
                           ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
