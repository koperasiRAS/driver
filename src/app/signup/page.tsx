'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle, User } from 'lucide-react'
import { signUpAction } from '@/app/actions/auth'

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return 'Password minimal 6 karakter'
    if (!/[A-Z]/.test(pwd)) return 'Password harus mengandung minimal 1 huruf besar'
    if (!/[a-z]/.test(pwd)) return 'Password harus mengandung minimal 1 huruf kecil'
    if (!/[0-9]/.test(pwd)) return 'Password harus mengandung minimal 1 angka'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Nama lengkap wajib diisi')
      return
    }

    if (!email.includes('@')) {
      setError('Alamat email tidak valid')
      return
    }

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }

    setLoading(true)

    try {
      // Always create as 'driver' role — owner creates accounts via dashboard
      const result = await signUpAction({ email, password, fullName, role: 'driver' })
      if (!result.success) {
        setError(result.error || 'Gagal membuat akun')
      } else {
        setSuccess(true)
        setTimeout(() => { router.push('/login') }, 2000)
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background illustration */}
      <div
        className="absolute inset-0 -z-0 bg-no-repeat bg-cover bg-right"
        style={{ backgroundImage: "url('/illustrations/splitscreen terbaru.png')" }}
      />

      {/* Full dark overlay */}
      <div className="absolute inset-0 -z-[1] bg-black/65" />

      {/* Taglines on left background */}
      <div className="hidden sm:block absolute left-0 top-0 z-20 h-full w-3/5 md:w-1/2 pointer-events-none">
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
          <h2
            className="text-white font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-4 sm:mb-5"
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}
          >
            Bergabung dengan
            <br className="hidden sm:block" />
            Trans RAS
          </h2>
          <p
            className="text-white/90 font-semibold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            Kelola armada &amp; pantau kinerja driver
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
          <div className="rounded-2xl border border-slate-200/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6 sm:p-8 space-y-5">

            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-700 rounded-xl mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M9 17H7a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                  <path d="M15 7h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2 2 2 0 0 1 2-2z" />
                  <line x1="9" x2="15" y1="7" y2="7" />
                  <rect width="12" height="8" x="6" y="14" rx="2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Buat Akun Driver</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Daftar sebagai driver — akun akan diverifikasi oleh owner
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {success ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Akun berhasil dibuat!</p>
                  <p className="text-xs opacity-80 mt-0.5">Mengalihkan ke halaman login...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Buat password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Konfirmasi Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
                  />
                </div>

                {/* Password Requirements */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Password harus mengandung:</p>
                  <ul className="text-xs space-y-1">
                    <li className={password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}>
                      ✓ Minimal 6 karakter
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}>
                      ✓ Minimal 1 huruf besar
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}>
                      ✓ Minimal 1 huruf kecil
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}>
                      ✓ Minimal 1 angka
                    </li>
                  </ul>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Membuat akun...
                    </>
                  ) : (
                    'Buat Akun'
                  )}
                </button>
              </form>
            )}

            {/* Login Link */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-teal-600 dark:text-teal-400 hover:underline">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
