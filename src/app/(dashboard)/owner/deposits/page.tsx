'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { DollarSign, CheckCircle, XCircle, Download, Image as ImageIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Deposit } from '@/types'
import { formatDate, formatCurrency, getDepositMethodLabel } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'

export default function OwnerDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchDeposits = async () => {
      try {
        const { data, error } = await supabase
          .from('deposits')
          .select(`
            *,
            driver:drivers(
              *,
              profile:profiles(*)
            )
          `)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setDeposits(data)
        }
      } catch (e) {
        console.error('Error fetching deposits:', e)
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(() => setLoading(false), 10000)
    fetchDeposits()

    // Real-time subscription for deposits
    const channel = supabase
      .channel('deposits-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deposits' },
        () => {
          fetchDeposits().catch(console.error)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [])

  const handleApprove = async (depositId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', depositId)

    if (!error) {
      setDeposits(deposits.map(d =>
        d.id === depositId
          ? { ...d, status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : d
      ))
    }
  }

  const handleReject = async (depositId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', depositId)

    if (!error) {
      setDeposits(deposits.map(d =>
        d.id === depositId
          ? { ...d, status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : d
      ))
    }
  }

  const filteredDeposits = (deposits || []).filter((deposit) => {
    if (filter === 'all') return true
    return deposit.status === filter
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu'
      case 'approved':
        return 'Disetujui'
      case 'rejected':
        return 'Ditolak'
      default:
        return status
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Setoran</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola setoran driver</p>
        </div>
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            onClick={() => {
              const csvData = filteredDeposits.map(d => ({
                Tanggal: d.deposit_date,
                Driver: d.driver?.profile?.full_name || '-',
                Jumlah: d.amount,
                Metode: getDepositMethodLabel(d.method),
                Status: getStatusLabel(d.status),
                Tanggal_Review: d.reviewed_at || '-',
              }))
              exportToCSV(csvData, 'setoran')
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
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              filter === 'pending'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Menunggu
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              filter === 'approved'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Disetujui
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              filter === 'rejected'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>

      {filteredDeposits.length === 0 ? (
        <Card>
          <EmptyState
            icon={<DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600" />}
            title="Belum ada setoran"
            description="Setoran driver akan muncul di sini"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeposits.map((deposit, index) => (
            <Card key={deposit.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {deposit.driver?.profile?.full_name || 'Driver Tidak Dikenal'}
                      </h3>
                      <Badge variant={getStatusVariant(deposit.status) as any}>
                        {getStatusLabel(deposit.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(deposit.deposit_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(deposit.amount)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {getDepositMethodLabel(deposit.method)}
                    </p>
                  </div>
                </div>

                {deposit.proof_photo_url && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Bukti Transfer
                    </p>
                    <button
                      onClick={() => setPreviewImage(deposit.proof_photo_url!)}
                      className="group relative"
                    >
                      <img
                        src={deposit.proof_photo_url}
                        alt="Bukti"
                        className="w-24 h-24 object-cover rounded-md border border-slate-200 dark:border-slate-700 group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">Perbesar</span>
                      </div>
                    </button>
                  </div>
                )}

                {deposit.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(deposit.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Setuju
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(deposit.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Photo Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewImage}
            alt="Bukti Transfer"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
