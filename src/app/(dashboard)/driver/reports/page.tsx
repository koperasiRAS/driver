'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { DailyReport } from '@/types'
import { formatDate, formatCurrency, formatTime, getReasonLabel, getPlatformLabel, canEditReport } from '@/lib/utils'

export default function DriverReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!driver) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('driver_id', driver.id)
        .order('report_date', { ascending: false })

      if (!error && data) {
        setReports(data)
      }
      setLoading(false)
    }

    fetchReports()
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat Laporan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Lihat riwayat laporan harian Anda</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-16 h-16 text-slate-300" />}
            title="Belum ada laporan"
            description="Laporan yang Anda kirim akan muncul di sini"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const canEdit = canEditReport(report.submitted_at)
            return (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          {report.status === 'narik' ? 'NARIK' : 'TIDAK NARIK'}
                        </h3>
                        <Badge variant={report.status === 'narik' ? 'info' : 'default'}>
                          {report.status === 'narik' ? 'Bekerja' : 'Tidak Bekerja'}
                        </Badge>
                        {!canEdit && (
                          <Badge variant="default">Terkunci</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDate(report.report_date)} at {formatTime(report.submitted_at)}
                      </p>
                    </div>
                    {report.status === 'narik' && report.daily_income && (
                      <p className="text-xl font-bold text-teal-600">
                        {formatCurrency(report.daily_income)}
                      </p>
                    )}
                  </div>

                  {report.status === 'narik' && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Order</p>
                        <p className="font-medium text-slate-800 dark:text-white">{report.number_of_orders || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Platform</p>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {report.platform ? getPlatformLabel(report.platform) : '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {report.status === 'tidak_narik' && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Alasan</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {report.reason ? getReasonLabel(report.reason) : '-'}
                      </p>
                    </div>
                  )}

                  {report.photo_url && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Foto</p>
                      <a
                        href={report.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={report.photo_url}
                          alt="Proof"
                          className="w-24 h-24 object-cover rounded-md border border-slate-200"
                        />
                      </a>
                    </div>
                  )}

                  {report.notes && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Catatan</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{report.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
