'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { FileText, Download, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { DailyReport } from '@/types'
import { formatDate, formatCurrency, formatTime, getReasonLabel, getPlatformLabel } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'

export default function OwnerReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'narik' | 'tidak_narik'>('all')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select(`
            *,
            driver:drivers(
              *,
              profile:profiles(*)
            )
          `)
          .order('submitted_at', { ascending: false })
          .limit(100)

        if (!error && data) {
          setReports(data)
        }
      } catch (e) {
        console.error('Error fetching reports:', e)
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(() => setLoading(false), 10000)
    fetchReports()

    // Real-time subscription for new reports
    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_reports' },
        () => {
          fetchReports().catch(console.error)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredReports = (reports || []).filter((report) => {
    if (filter === 'all') return true
    return report.status === filter
  })

  if (loading) {
    return <LoadingPage />
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan Harian</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Lihat semua laporan driver</p>
        </div>
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            onClick={() => {
              const csvData = filteredReports.map(r => ({
                Tanggal: r.report_date,
                Driver: r.driver?.profile?.full_name || '-',
                Status: r.status === 'narik' ? 'Narik' : 'Tidak Narik',
                Pendapatan: r.daily_income || 0,
                Jumlah_Order: r.number_of_orders || 0,
                Platform: r.platform ? getPlatformLabel(r.platform) : '-',
                Alasan: r.reason ? getReasonLabel(r.reason) : '-',
                Catatan: r.notes || '-',
              }))
              exportToCSV(csvData, 'laporan_harian')
            }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              filter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('narik')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              filter === 'narik'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            NARIK
          </button>
          <button
            onClick={() => setFilter('tidak_narik')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              filter === 'tidak_narik'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            TIDAK NARIK
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-16 h-16 text-slate-300 dark:text-slate-600" />}
            title="Belum ada laporan"
            description="Laporan driver akan muncul di sini"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, index) => (
            <Card key={report.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {report.driver?.profile?.full_name || 'Driver Tidak Dikenal'}
                      </h3>
                      <Badge variant={report.status === 'narik' ? 'info' : 'default'}>
                        {report.status === 'narik' ? 'NARIK' : 'TIDAK NARIK'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(report.report_date)} pukul {formatTime(report.submitted_at)}
                    </p>
                  </div>
                  {report.status === 'narik' && report.daily_income && (
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(report.daily_income)}
                    </p>
                  )}
                </div>

                {report.status === 'narik' ? (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pendapatan Harian</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {report.daily_income ? formatCurrency(report.daily_income) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Jumlah Order</p>
                      <p className="font-medium text-slate-800 dark:text-white">{report.number_of_orders || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Platform</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {report.platform ? getPlatformLabel(report.platform) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Foto Bukti</p>
                      {report.photo_url ? (
                        <img
                          src={report.photo_url}
                          alt="Bukti narik"
                          className="mt-1 w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(report.photo_url || null)}
                        />
                      ) : (
                        <p className="text-slate-400 text-sm">Tidak ada foto</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Alasan</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {report.reason ? getReasonLabel(report.reason) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Foto</p>
                      {report.photo_url ? (
                        <a
                          href={report.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 dark:text-teal-400 hover:underline text-sm"
                        >
                          Lihat Foto
                        </a>
                      ) : (
                        <p className="text-slate-400 text-sm">Tidak ada foto</p>
                      )}
                    </div>
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
          ))}
        </div>
      )}
    </div>

      {/* Photo Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
