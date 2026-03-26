'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { resetAllDataAction } from '@/app/actions/reset'

export default function OwnerSettingsPage() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleReset = async () => {
    if (confirmText !== 'RESET SEMUA DATA') return
    setResetting(true)
    const res = await resetAllDataAction()
    setResult(res)
    setResetting(false)
    setShowConfirm(false)
    setConfirmText('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola sistem TRANS RAS</p>
      </div>

      {result && (
        <div className={`flex items-center gap-2 p-4 rounded-lg border ${
          result.success
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          {result.message}
        </div>
      )}

      {/* Reset All Data */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zona Bahaya
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-lg">
            <h3 className="font-semibold text-red-700 dark:text-red-400">Reset Semua Data</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Menghapus <strong>semua</strong> data: laporan harian, setoran, pengeluaran driver, log aktivitas, dan data driver.
              Akun owner tetap tersimpan. Sistem akan kembali seperti baru.
            </p>
            <p className="text-xs text-red-500 mt-2">
              Tindakan ini TIDAK BISA dibatalkan!
            </p>

            {!showConfirm ? (
              <Button
                variant="secondary"
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setShowConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Semua Data
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Ketik <code className="bg-red-100 dark:bg-red-900 px-1.5 py-0.5 rounded text-xs">RESET SEMUA DATA</code> untuk konfirmasi:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="RESET SEMUA DATA"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleReset}
                    disabled={confirmText !== 'RESET SEMUA DATA' || resetting}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mereset...
                      </>
                    ) : (
                      'Konfirmasi Reset'
                    )}
                  </Button>
                  <Button variant="secondary" onClick={() => { setShowConfirm(false); setConfirmText('') }}>
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
