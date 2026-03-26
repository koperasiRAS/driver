'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      setValidating(true)
      const code = searchParams.get('code')

      if (!code) {
        setTokenError('Token tidak valid. Silakan minta link reset password baru.')
        setValidating(false)
        return
      }

      try {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setTokenError('Link reset password sudah kadaluarsa. Silakan minta yang baru.')
          console.error('Token exchange error:', error)
        } else {
          setIsValidToken(true)
        }
      } catch (err) {
        setTokenError('Terjadi kesalahan. Silakan minta link reset password baru.')
        console.error(err)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [searchParams])

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
    setLoading(true)

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Gagal mereset password')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const cardClass =
    'w-full rounded-2xl border border-slate-200/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6 sm:p-8'

  // Token invalid or missing
  if (tokenError) {
    return (
      <div className={cardClass}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl mb-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Token Tidak Valid</h2>
        </div>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mb-4">
          {tokenError}
        </div>
        <Link
          href="/forgot-password"
          className="block w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm text-center transition-colors mb-3"
        >
          Minta Link Reset Baru
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          Kembali ke halaman login
        </Link>
      </div>
    )
  }

  // Validating token
  if (validating) {
    return (
      <div className={cardClass}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl mb-3">
            <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Memvalidasi...</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mohon tunggu sebentar</p>
        </div>
      </div>
    )
  }

  // Success
  if (success) {
    return (
      <div className={cardClass}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Password Berhasil Diubah!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Anda akan dialihkan ke halaman login...
          </p>
        </div>
        <Link
          href="/login"
          className="block w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm text-center transition-colors"
        >
          Masuk Sekarang
        </Link>
      </div>
    )
  }

  // Reset form
  return (
    <div className={cardClass}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-700 rounded-xl mb-3">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Masukkan password baru di bawah ini
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Password Baru
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Password requirements */}
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
            <li className={password === confirmPassword && confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}>
              ✓ Password cocok
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Memperbarui...
            </>
          ) : (
            'Simpan Password Baru'
          )}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mt-4"
      >
        Kembali ke halaman login
      </Link>
    </div>
  )
}
