'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingPage } from '@/components/common/loading-spinner'
import { Wallet, Plus, Loader2, AlertCircle, Fuel, Coffee, Wrench, MoreHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Driver } from '@/types'
import { formatDate, formatCurrency, getTodayDateString } from '@/lib/utils'

const CATEGORY_OPTIONS = [
  { value: 'bbm', label: 'BBM / Bensin' },
  { value: 'makan', label: 'Makan / Minum' },
  { value: 'parkir', label: 'Parkir / Tol' },
  { value: 'perawatan', label: 'Perawatan Kendaraan' },
  { value: 'lainnya', label: 'Lainnya' },
]

interface Expense {
  id: string
  driver_id: string
  amount: number
  category: string
  description: string
  expense_date: string
  created_at: string
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'bbm': return <Fuel className="w-4 h-4" />
    case 'makan': return <Coffee className="w-4 h-4" />
    case 'perawatan': return <Wrench className="w-4 h-4" />
    default: return <MoreHorizontal className="w-4 h-4" />
  }
}

const getCategoryLabel = (category: string) => {
  const opt = CATEGORY_OPTIONS.find(o => o.value === category)
  return opt ? opt.label : category
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'bbm': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'makan': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'parkir': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'perawatan': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }
}

export default function DriverExpensesPage() {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('bbm')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(getTodayDateString())

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

        try {
          const { data } = await supabase
            .from('driver_expenses')
            .select('*')
            .eq('driver_id', driverData.id)
            .order('created_at', { ascending: false })
            .limit(50)

          setExpenses(data || [])
        } catch { /* table may not exist */ }
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!driver) {
      setError('Driver tidak ditemukan')
      return
    }

    if (!amount || Number(amount) <= 0) {
      setError('Masukkan jumlah pengeluaran')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('driver_expenses')
        .insert({
          driver_id: driver.id,
          amount: Number(amount),
          category,
          description: description || null,
          expense_date: expenseDate,
        })

      if (insertError) {
        if (insertError.message?.includes('driver_expenses')) {
          setError('Tabel pengeluaran belum dibuat. Minta owner untuk menjalankan migration SQL.')
        } else {
          setError(insertError.message)
        }
        setSubmitting(false)
        return
      }

      // Refresh
      const { data } = await supabase
        .from('driver_expenses')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setExpenses(data || [])
      setShowForm(false)
      setAmount('')
      setCategory('bbm')
      setDescription('')
      setExpenseDate(getTodayDateString())
    } catch {
      setError('Terjadi kesalahan')
    }

    setSubmitting(false)
  }

  // Calculate totals
  const today = getTodayDateString()
  const todayExpenses = expenses
    .filter(e => e.expense_date === today)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pengeluaran</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Catat pengeluaran harian Anda</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Today Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Pengeluaran Hari Ini</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(todayExpenses)}</p>
            </div>
            <Wallet className="w-8 h-8 text-amber-300" />
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Input
                id="amount"
                type="number"
                label="Jumlah (Rp)"
                placeholder="Contoh: 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Select
                id="category"
                label="Kategori"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
              />
              <Input
                id="expenseDate"
                type="date"
                label="Tanggal"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
              <Textarea
                id="description"
                label="Keterangan (opsional)"
                placeholder="Contoh: BBM Pertamax 5 liter"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
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

      {/* Expenses List */}
      {expenses.length === 0 && !showForm ? (
        <Card>
          <EmptyState
            icon={<Wallet className="w-16 h-16 text-slate-300" />}
            title="Belum ada pengeluaran"
            description="Catat pengeluaran untuk tracking keuangan"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(expense.category)}`}>
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getCategoryLabel(expense.category)} • {formatDate(expense.expense_date)}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{expense.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
