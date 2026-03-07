'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { Users, Plus, X, Loader2, Eye, EyeOff, Pencil, Trash2, FileText, DollarSign, Calendar, Search, UserCheck, UserX, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Driver, DailyReport, Deposit } from '@/types'
import { createDriverAction, updateDriverAction, deleteDriverAction, resetPasswordAction } from '@/app/actions/driver'
import { formatCurrency, formatDate } from '@/lib/utils'

type ModalType = 'add' | 'edit' | 'detail' | 'delete' | 'reset_password' | null
type FilterStatus = 'all' | 'active' | 'inactive'

export default function OwnerDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState('')

  // Detail view data
  const [driverReports, setDriverReports] = useState<DailyReport[]>([])
  const [driverDeposits, setDriverDeposits] = useState<Deposit[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setDrivers(data)
      }
    } catch (e) {
      console.error('Error fetching drivers:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchDriverDetail = async (driver: Driver) => {
    setDetailLoading(true)
    try {
      const supabase = createClient()

      const [reportsRes, depositsRes] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('*')
          .eq('driver_id', driver.id)
          .order('report_date', { ascending: false })
          .limit(10),
        supabase
          .from('deposits')
          .select('*')
          .eq('driver_id', driver.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      setDriverReports(reportsRes.data || [])
      setDriverDeposits(depositsRes.data || [])
    } catch (e) {
      console.error('Error fetching driver detail:', e)
    } finally {
      setDetailLoading(false)
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setPhone('')
    setVehiclePlate('')
    setVehicleType('')
    setError('')
    setSuccess('')
  }

  const openModal = (type: ModalType, driver?: Driver) => {
    resetForm()
    if (driver) {
      setSelectedDriver(driver)
      if (type === 'edit') {
        setFullName(driver.profile?.full_name || '')
        setPhone(driver.profile?.phone || '')
        setVehicleType(driver.vehicle_type || '')
        setVehiclePlate(driver.vehicle_plate || '')
      }
      if (type === 'detail') {
        fetchDriverDetail(driver)
      }
    }
    setActiveModal(type)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedDriver(null)
    setDriverReports([])
    setDriverDeposits([])
    resetForm()
  }

  // --- Add Driver ---
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName || !email || !password) {
      setError('Nama, email, dan password wajib diisi')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setSubmitting(true)
    try {
      const result = await createDriverAction({
        fullName, email, password,
        phone: phone || undefined,
        vehicleType: vehicleType || undefined,
        vehiclePlate: vehiclePlate || undefined,
      })
      if (!result.success) {
        setError(result.error || 'Gagal menambahkan driver')
      } else {
        setSuccess('Driver berhasil ditambahkan!')
        closeModal()
        fetchDrivers()
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
    setSubmitting(false)
  }

  // --- Edit Driver ---
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriver) return
    setError('')

    if (!fullName) {
      setError('Nama wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const result = await updateDriverAction({
        driverId: selectedDriver.id,
        userId: selectedDriver.user_id,
        fullName,
        phone: phone || undefined,
        vehicleType: vehicleType || undefined,
        vehiclePlate: vehiclePlate || undefined,
      })
      if (!result.success) {
        setError(result.error || 'Gagal mengupdate driver')
      } else {
        setSuccess('Driver berhasil diupdate!')
        closeModal()
        fetchDrivers()
      }
    } catch {
      setError('Terjadi kesalahan.')
    }
    setSubmitting(false)
  }

  // --- Delete Driver ---
  const handleDelete = async () => {
    if (!selectedDriver) return
    setSubmitting(true)
    setError('')
    try {
      const result = await deleteDriverAction({
        driverId: selectedDriver.id,
        userId: selectedDriver.user_id,
        driverName: selectedDriver.profile?.full_name || 'Unknown',
      })
      if (!result.success) {
        setError(result.error || 'Gagal menghapus driver')
      } else {
        setSuccess('Driver berhasil dihapus!')
        closeModal()
        fetchDrivers()
      }
    } catch {
      setError('Terjadi kesalahan.')
    }
    setSubmitting(false)
  }

  // --- Toggle Active Status ---
  const handleToggleActive = async (driver: Driver) => {
    const action = driver.is_active ? 'menonaktifkan' : 'mengaktifkan kembali'
    if (!confirm(`Yakin ingin ${action} driver ini?`)) return

    const supabase = createClient()
    await supabase
      .from('drivers')
      .update({ is_active: !driver.is_active })
      .eq('id', driver.id)

    fetchDrivers()
  }

  // --- Filter & Search ---
  const filteredDrivers = (drivers || []).filter((d) => {
    const matchesSearch = searchQuery === '' ||
      (d.profile?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.profile?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.vehicle_plate || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && d.is_active) ||
      (filterStatus === 'inactive' && !d.is_active)

    return matchesSearch && matchesFilter
  })

  if (loading) return <LoadingPage />

  // Shared input class
  const inputClass = "w-full h-10 px-3 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Karyawan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola driver dan karyawan — {drivers.filter(d => d.is_active).length} aktif, {drivers.filter(d => !d.is_active).length} nonaktif
          </p>
        </div>
        <Button onClick={() => openModal('add')}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Driver
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                filterStatus === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Success notification */}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Driver List */}
      {filteredDrivers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="w-16 h-16 text-slate-300 dark:text-slate-600" />}
            title={searchQuery || filterStatus !== 'all' ? 'Tidak ada driver ditemukan' : 'Belum ada driver'}
            description={searchQuery || filterStatus !== 'all' ? 'Coba ubah filter atau kata kunci pencarian' : 'Tambahkan driver pertama Anda untuk memulai'}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Driver ({filteredDrivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Nama</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">No. HP</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Kendaraan</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver, index) => (
                    <tr
                      key={driver.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-white">{driver.profile?.full_name || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {driver.profile?.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {driver.profile?.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {driver.vehicle_type && driver.vehicle_plate
                          ? `${driver.vehicle_type} • ${driver.vehicle_plate}`
                          : driver.vehicle_plate || driver.vehicle_type || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={driver.is_active ? 'success' : 'default'}>
                          {driver.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModal('detail', driver)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', driver)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(driver)}
                            className={`p-1.5 rounded transition-colors ${
                              driver.is_active
                                ? 'text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                            title={driver.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {driver.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openModal('reset_password', driver)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('delete', driver)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Add Driver Modal */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tambah Driver Baru</CardTitle>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap driver" className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" className={`${inputClass} pr-10`} required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. HP</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812xxxxxxx" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenis Kendaraan</label>
                      <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Mobil/Motor" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plat Nomor</label>
                      <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="B 1234 XYZ" className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</> : 'Tambah Driver'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Driver Modal */}
      {activeModal === 'edit' && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Driver</CardTitle>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap driver" className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input type="email" value={selectedDriver.profile?.email || ''} className={`${inputClass} opacity-50 cursor-not-allowed`} disabled />
                    <p className="text-xs text-slate-400 mt-1">Email tidak bisa diubah</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. HP</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812xxxxxxx" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenis Kendaraan</label>
                      <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Mobil/Motor" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plat Nomor</label>
                      <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="B 1234 XYZ" className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan Perubahan'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === 'delete' && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Card className="w-full max-w-sm animate-fade-in">
            <CardContent className="pt-6">
              {error && <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Hapus Driver</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Yakin ingin menghapus <strong>{selectedDriver.profile?.full_name}</strong>?
                </p>
                <p className="text-xs text-red-500 mb-6">
                  Tindakan ini akan menghapus akun, profil, dan semua data driver secara permanen.
                </p>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Batal</Button>
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="flex-1 h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menghapus...</> : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail View Modal */}
      {activeModal === 'detail' && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detail Driver</CardTitle>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Info */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{selectedDriver.profile?.full_name || '-'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDriver.profile?.email || '-'}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant={selectedDriver.is_active ? 'success' : 'default'}>
                      {selectedDriver.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {selectedDriver.profile?.phone && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">📱 {selectedDriver.profile.phone}</span>
                    )}
                    {selectedDriver.vehicle_type && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">🚗 {selectedDriver.vehicle_type}</span>
                    )}
                    {selectedDriver.vehicle_plate && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">🔢 {selectedDriver.vehicle_plate}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { closeModal(); setTimeout(() => openModal('edit', selectedDriver), 100) }}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <FileText className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{driverReports.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Laporan</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{driverDeposits.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Setoran</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{formatDate(selectedDriver.created_at)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bergabung</p>
                </div>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
              ) : (
                <>
                  {/* Recent Reports */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Laporan Terbaru
                    </h4>
                    {driverReports.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Belum ada laporan</p>
                    ) : (
                      <div className="space-y-2">
                        {driverReports.slice(0, 5).map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={r.status === 'narik' ? 'success' : 'default'}>
                                {r.status === 'narik' ? 'Narik' : 'Tidak Narik'}
                              </Badge>
                              <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(r.report_date)}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {r.daily_income ? formatCurrency(r.daily_income) : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Deposits */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Setoran Terbaru
                    </h4>
                    {driverDeposits.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Belum ada setoran</p>
                    ) : (
                      <div className="space-y-2">
                        {driverDeposits.slice(0, 5).map((d) => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'default'}>
                                {d.status === 'approved' ? 'Disetujui' : d.status === 'rejected' ? 'Ditolak' : 'Pending'}
                              </Badge>
                              <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(d.deposit_date)}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {formatCurrency(d.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Tutup</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {activeModal === 'reset_password' && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Card className="w-full max-w-sm animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reset Password</CardTitle>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault()
                setError('')
                if (!newPassword || newPassword.length < 6) {
                  setError('Password minimal 6 karakter')
                  return
                }
                if (newPassword !== confirmPassword) {
                  setError('Konfirmasi password tidak cocok')
                  return
                }
                setSubmitting(true)
                try {
                  const result = await resetPasswordAction({
                    userId: selectedDriver.user_id,
                    driverName: selectedDriver.profile?.full_name || '',
                    newPassword,
                  })
                  if (!result.success) {
                    setError(result.error || 'Gagal reset password')
                  } else {
                    setSuccess(`Password ${selectedDriver.profile?.full_name} berhasil direset!`)
                    closeModal()
                  }
                } catch {
                  setError('Terjadi kesalahan.')
                }
                setSubmitting(false)
              }} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Reset password untuk <strong className="text-slate-800 dark:text-white">{selectedDriver.profile?.full_name}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password Baru *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className={`${inputClass} pr-10`} required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Password *</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" className={inputClass} required minLength={6} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Reset Password'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
