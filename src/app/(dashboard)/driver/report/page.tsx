'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Loader2, MapPin, TrendingUp, CheckCircle2, Camera, X, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Driver, DailyReport } from '@/types'
import { getTodayDateString, formatCurrency, formatTime } from '@/lib/utils'
import { DAILY_TARGET } from '@/lib/constants'

const PLATFORM_OPTIONS = [
  { value: 'lalamove', label: 'Lalamove' },
  { value: 'direct_call', label: 'Telepon Langsung' },
  { value: 'mixed', label: 'Campuran' },
]

const REASON_OPTIONS = [
  { value: 'libur', label: 'Libur' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'vehicle_issue', label: 'Kendaraan Rusak' },
  { value: 'no_orders', label: 'Tidak Ada Order' },
  { value: 'personal_matter', label: 'Urusan Pribadi' },
  { value: 'other', label: 'Lainnya' },
]

export default function DriverReportPage() {
  const router = useRouter()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [todayReports, setTodayReports] = useState<DailyReport[]>([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [todayExpenses, setTodayExpenses] = useState(0)
  const [reportDate, setReportDate] = useState(getTodayDateString())

  // Form fields
  const [status, setStatus] = useState<'narik' | 'tidak_narik' | null>(null)
  const [dailyIncome, setDailyIncome] = useState('')
  const [numberOfOrders, setNumberOfOrders] = useState('')
  const [platform, setPlatform] = useState<string>('lalamove')
  const [reason, setReason] = useState<string>('libur')
  const [notes, setNotes] = useState('')

  // Photo proof (for narik)
  const [proofPhoto, setProofPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Photo proof (for tidak narik)
  const [tidakNarikPhoto, setTidakNarikPhoto] = useState<File | null>(null)
  const [tidakNarikPhotoPreview, setTidakNarikPhotoPreview] = useState<string | null>(null)

  // GPS
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchTodayReports = async (driverId: string, date: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('driver_id', driverId)
      .eq('report_date', date)
      .order('submitted_at', { ascending: false })

    const reports = data || []
    setTodayReports(reports)
    const total = reports
      .filter((r) => r.status === 'narik')
      .reduce((sum, r) => sum + Number(r.daily_income || 0), 0)
    setTodayTotal(total)

    // Fetch expenses for the selected date
    try {
      const { data: expenses } = await supabase
        .from('driver_expenses')
        .select('amount')
        .eq('driver_id', driverId)
        .eq('expense_date', date)
      const expTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)
      setTodayExpenses(expTotal)
    } catch { /* table may not exist yet */ }
  }

  useEffect(() => {
    const fetchDriver = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (driverData) {
        setDriver(driverData)
        await fetchTodayReports(driverData.id, getTodayDateString())
      }

      setLoading(false)
    }

    fetchDriver()
  }, [router])

  // Re-fetch when reportDate changes
  useEffect(() => {
    if (driver) {
      fetchTodayReports(driver.id, reportDate)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportDate])

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationStatus('success')
        },
        (err) => {
          console.error('GPS error:', err)
          setLocationStatus(err.code === 1 ? 'denied' : 'error')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setLocationStatus('error')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!status) {
      setError('Pilih NARIK atau TIDAK NARIK')
      return
    }
    if (!driver) {
      setError('Driver tidak ditemukan')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const reportData: Record<string, unknown> = {
        driver_id: driver.id,
        report_date: reportDate,
        status,
        submitted_at: new Date().toISOString(),
      }

      if (status === 'narik') {
        if (!dailyIncome || Number(dailyIncome) <= 0) {
          setError('Mohon isi pendapatan')
          setSubmitting(false)
          return
        }
        if (!numberOfOrders || Number(numberOfOrders) <= 0) {
          setError('Mohon isi jumlah order')
          setSubmitting(false)
          return
        }
        if (!proofPhoto) {
          setError('Mohon upload foto bukti (screenshot aplikasi atau foto kegiatan narik)')
          setSubmitting(false)
          return
        }

        // Upload proof photo
        setUploadingPhoto(true)
        const fileExt = proofPhoto.name.split('.').pop()
        const fileName = `proof_${driver.id}_${Date.now()}.${fileExt}`
        const filePath = `${driver.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('driver-photos')
          .upload(filePath, proofPhoto, { contentType: proofPhoto.type, upsert: false })

        setUploadingPhoto(false)

        if (uploadError) {
          setError('Gagal upload foto: ' + uploadError.message)
          setSubmitting(false)
          return
        }

        const { data: urlData } = supabase.storage.from('driver-photos').getPublicUrl(filePath)

        reportData.daily_income = Number(dailyIncome)
        reportData.number_of_orders = Number(numberOfOrders)
        reportData.platform = platform
        reportData.photo_url = urlData.publicUrl
      } else {
        reportData.reason = reason

        // Upload tidak narik photo if provided
        if (tidakNarikPhoto) {
          setUploadingPhoto(true)
          const fileExt = tidakNarikPhoto.name.split('.').pop()
          const fileName = `tidak_narik_${driver.id}_${Date.now()}.${fileExt}`
          const filePath = `${driver.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('driver-photos')
            .upload(filePath, tidakNarikPhoto, { contentType: tidakNarikPhoto.type, upsert: false })

          setUploadingPhoto(false)

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('driver-photos').getPublicUrl(filePath)
            reportData.photo_url = urlData.publicUrl
          }
        }
      }

      if (notes) reportData.notes = notes

      const { error: insertError } = await supabase
        .from('daily_reports')
        .insert(reportData)

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }

      // Save GPS
      if (location) {
        try {
          await supabase.from('driver_locations').insert({
            driver_id: driver.id,
            latitude: location.lat,
            longitude: location.lng,
          })
        } catch { /* non-critical */ }
      }

      // Refresh data for selected date
      await fetchTodayReports(driver.id, reportDate)
      setSuccess(true)

      // Reset form for next input
      setTimeout(() => {
        setSuccess(false)
        setStatus(null)
        setDailyIncome('')
        setNumberOfOrders('')
        setNotes('')
        setProofPhoto(null)
        setPhotoPreview(null)
        setTidakNarikPhoto(null)
        setTidakNarikPhotoPreview(null)
      }, 2000)
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const surplus = todayTotal - DAILY_TARGET - todayExpenses
  const targetReached = todayTotal >= DAILY_TARGET

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Isi Laporan Harian</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {new Date(reportDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* GPS Status */}
      {locationStatus === 'success' && location && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
          <MapPin className="w-4 h-4" />
          📍 Lokasi tercatat ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
        </div>
      )}
      {locationStatus === 'loading' && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Mendeteksi lokasi...
        </div>
      )}

      {/* Daily Financial Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Ringkasan Hari Ini
            </h3>
            {targetReached && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Target Tercapai ✓
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Pendapatan</p>
              <p className={`text-lg font-bold ${targetReached ? 'text-emerald-600' : 'text-teal-700 dark:text-teal-300'}`}>
                {formatCurrency(todayTotal)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Setoran</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(DAILY_TARGET)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pengeluaran</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(todayExpenses)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {surplus >= 0 ? 'Kantong Pribadi 💰' : 'Kurang'}
              </p>
              <p className={`text-lg font-bold ${surplus >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(Math.abs(surplus))}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${targetReached ? 'bg-emerald-500' : 'bg-teal-600'}`}
              style={{ width: `${Math.min((todayTotal / DAILY_TARGET) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
            {Math.round((todayTotal / DAILY_TARGET) * 100)}% dari target
          </p>
        </CardContent>
      </Card>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 animate-fade-in">
          <Check className="w-5 h-5" />
          <span className="font-medium">Laporan berhasil dikirim! Anda bisa menambah laporan lagi.</span>
        </div>
      )}

      {/* Report Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tambah Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Kerja
              </label>
              <input
                type="date"
                value={reportDate}
                max={getTodayDateString()}
                onChange={(e) => {
                  setReportDate(e.target.value)
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Pilih tanggal Anda bekerja. Setoran akan masuk ke bulan tanggal tersebut.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStatus('narik')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    status === 'narik'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-800 dark:text-white">NARIK</p>
                  <p className="text-xs text-slate-500">Bekerja hari ini</p>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('tidak_narik')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    status === 'tidak_narik'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-800 dark:text-white">TIDAK NARIK</p>
                  <p className="text-xs text-slate-500">Tidak bekerja hari ini</p>
                </button>
              </div>
            </div>

            {status === 'narik' && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {/* Photo Proof Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    📸 Foto Bukti Narik <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Screenshot aplikasi Lalamove / foto kegiatan narik dengan nominal harga
                  </p>

                  {!photoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-all">
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Tap untuk upload foto</span>
                      <span className="text-xs text-slate-400 mt-1">JPG, PNG, JPEG</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setProofPhoto(file)
                            setPhotoPreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full max-w-sm h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProofPhoto(null)
                          setPhotoPreview(null)
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Foto siap dikirim
                      </p>
                    </div>
                  )}

                  {uploadingPhoto && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-teal-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengupload foto...
                    </div>
                  )}
                </div>

                <Input
                  id="dailyIncome"
                  type="number"
                  label="Pendapatan (Rp)"
                  placeholder="Contoh: 50000"
                  value={dailyIncome}
                  onChange={(e) => setDailyIncome(e.target.value)}
                />
                <Input
                  id="numberOfOrders"
                  type="number"
                  label="Jumlah Order"
                  placeholder="Contoh: 3"
                  value={numberOfOrders}
                  onChange={(e) => setNumberOfOrders(e.target.value)}
                />
                <Select
                  id="platform"
                  label="Platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  options={PLATFORM_OPTIONS}
                />
              </div>
            )}

            {status === 'tidak_narik' && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Select
                  id="reason"
                  label="Alasan"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  options={REASON_OPTIONS}
                />

                {/* Photo documentation for tidak narik */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    📸 Foto Bukti / Dokumentasi <span className="text-slate-400 text-xs font-normal">(opsional)</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Foto bukti kenapa tidak narik (surat dokter, foto kendaraan rusak, dll)
                  </p>

                  {!tidakNarikPhotoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all">
                      <Camera className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Tap untuk upload foto</span>
                      <span className="text-xs text-slate-400 mt-1">JPG, PNG, JPEG</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setTidakNarikPhoto(file)
                            setTidakNarikPhotoPreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={tidakNarikPhotoPreview}
                        alt="Preview"
                        className="w-full max-w-sm h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTidakNarikPhoto(null)
                          setTidakNarikPhotoPreview(null)
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Foto siap dikirim
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Textarea
              id="notes"
              label="Catatan (opsional)"
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Laporan'
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/driver')}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Today's Reports List */}
      {todayReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Laporan{' '}
              {new Date(reportDate + 'T00:00:00').toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })} ({todayReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {report.photo_url && (
                      <img src={report.photo_url} alt="Bukti" className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === 'narik' ? 'success' : 'warning'}>
                          {report.status === 'narik' ? 'NARIK' : 'TIDAK NARIK'}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTime(report.submitted_at)}
                        </span>
                      </div>
                      {report.status === 'tidak_narik' && report.reason && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Alasan: {REASON_OPTIONS.find(r => r.value === report.reason)?.label || report.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  {report.status === 'narik' && (
                    <span className="font-semibold text-teal-600">
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
