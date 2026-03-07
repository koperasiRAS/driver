'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FileInput } from '@/components/ui/file-input'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { DollarSign, Plus, Loader2, AlertCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Driver, Deposit, DepositMethod } from '@/types'
import { formatDate, formatCurrency, getDepositMethodLabel, getTodayDateString } from '@/lib/utils'

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Transfer' },
]

export default function DriverDepositsPage() {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<DepositMethod>('cash')
  const [depositDate, setDepositDate] = useState(getTodayDateString())
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (driverData) {
        setDriver(driverData)

        const { data } = await supabase
          .from('deposits')
          .select('*')
          .eq('driver_id', driverData.id)
          .order('created_at', { ascending: false })

        setDeposits(data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
  }

  const uploadPhoto = async (driverId: string): Promise<string | null> => {
    if (!photo) return null

    const supabase = createClient()
    const fileExt = photo.name.split('.').pop()
    const fileName = `deposit_${driverId}_${Date.now()}.${fileExt}`
    const filePath = `${driverId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('driver-photos')
      .upload(filePath, photo, {
        contentType: photo.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage.from('driver-photos').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!driver) {
      setError('Driver not found')
      return
    }

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setSubmitting(true)

    try {
      let photoUrl = null
      if (photo) {
        photoUrl = await uploadPhoto(driver.id)
      }

      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('deposits')
        .insert({
          driver_id: driver.id,
          amount: Number(amount),
          method,
          deposit_date: depositDate,
          proof_photo_url: photoUrl,
          status: 'pending',
        })

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }

      // Refresh deposits
      const { data } = await supabase
        .from('deposits')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false })

      setDeposits(data || [])
      setSuccess(true)
      setShowForm(false)
      setAmount('')
      setMethod('cash')
      setDepositDate(getTodayDateString())
      setPhoto(null)
      setPhotoPreview(null)
    } catch (err) {
      setError('An error occurred. Please try again.')
    }

    setSubmitting(false)
  }

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

  if (loading) {
    return <LoadingPage />
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat Setoran</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Lacak riwayat setoran Anda</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Setoran Baru
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Kirim Setoran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Input
                id="amount"
                type="number"
                label="Jumlah (IDR)"
                placeholder="Masukkan jumlah setoran"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Select
                id="method"
                label="Metode"
                value={method}
                onChange={(e) => setMethod(e.target.value as DepositMethod)}
                options={METHOD_OPTIONS}
              />
              <Input
                id="depositDate"
                type="date"
                label="Tanggal Setoran"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                required
              />
              <FileInput
                id="photo"
                label="Foto Bukti"
                accept="image/*"
                onChange={handlePhotoChange}
                preview={photoPreview}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Setoran'
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {deposits.length === 0 && !showForm ? (
        <Card>
          <EmptyState
            icon={<DollarSign className="w-16 h-16 text-slate-300" />}
            title="Belum ada setoran"
            description="Kirim setoran pertama Anda"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <Card key={deposit.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {formatCurrency(deposit.amount)}
                      </h3>
                      <Badge variant={getStatusVariant(deposit.status) as any}>
                        {deposit.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(deposit.deposit_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {getDepositMethodLabel(deposit.method)}
                    </p>
                  </div>
                </div>

                {deposit.proof_photo_url && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Foto Bukti</p>
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
