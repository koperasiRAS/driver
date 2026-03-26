'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email) {
      setError('Alamat email wajib diisi')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message || 'Gagal mengirim email reset password')
      } else {
        setSuccess(true)
        setEmail('')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background illustration — same as login page */}
      <div
        className="absolute inset-0 -z-0 bg-no-repeat bg-cover bg-right"
        style={{ backgroundImage: "url('/illustrations/splitscreen terbaru.png')" }}
      />

      {/* Full dark overlay */}
      <div className="absolute inset-0 -z-[1] bg-black/65" />

      {/* Taglines on left background — hidden on mobile */}
      <div className="hidden sm:block absolute left-0 top-0 z-20 h-full w-3/5 md:w-1/2 pointer-events-none">
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
          <h2
            className="text-white font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-4 sm:mb-5"
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}
          >
            Lupa Password?
            <br className="hidden sm:block" />
            Kami Bantu Pulihkan
          </h2>
          <p
            className="text-white/90 font-semibold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            Amankan akun Anda dengan mudah
          </p>
          <div
            className="w-20 sm:w-24 md:w-28 h-1.5 md:h-2 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full mt-6 sm:mt-8 md:mt-10"
            style={{ boxShadow: '0 0 16px rgba(99,102,241,0.7)' }}
          />
        </div>
      </div>

      {/* Form — right side desktop, centered mobile */}
      <div className="relative z-30 flex min-h-screen w-full items-center justify-end sm:justify-end px-4 py-10 sm:px-8 md:px-12 lg:px-16">
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] lg:max-w-[420px]">
          {/* Form card */}
          <div className="w-full rounded-2xl border border-slate-200/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6 sm:p-8 space-y-5">
            {/* Branding */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-700 rounded-xl mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lupa Password?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Masukkan email untuk menerima link reset password
              </p>
            </div>

            {/* Success */}
            {success && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Email terkirim!</p>
                  <p className="text-xs opacity-80 mt-0.5">
                    Periksa inbox email Anda. Jika tidak ada, cek folder spam.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Link Reset Password'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Kirim Email Lain
                </button>
              </div>
            )}

            {/* Back to login */}
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali ke halaman login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
