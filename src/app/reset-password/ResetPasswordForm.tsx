'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    const validateToken = async () => {
      const code = searchParams.get('code')

      if (!code) {
        setTokenError('Invalid or missing reset token. Please request a new password reset.')
        return
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setTokenError('This password reset link has expired. Please request a new one.')
          console.error('Token exchange error:', error)
        } else {
          setIsValidToken(true)
        }
      } catch (err) {
        setTokenError('An error occurred. Please request a new password reset link.')
        console.error(err)
      }
    }

    validateToken()
  }, [searchParams])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return 'Password must be at least 6 characters'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number'
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
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to reset password')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-form-wrapper">
      {tokenError ? (
        <>
          <div className="login-form-header">
            <h2>Token Invalid</h2>
          </div>

          <div className="login-error-alert">
            <AlertCircle size={16} />
            <span>{tokenError}</span>
          </div>

          <Link href="/forgot-password" className="login-submit-btn w-full inline-flex items-center justify-center gap-2">
            Request New Reset Link
          </Link>

          <Link href="/login" className="login-back-link">
            Back to Sign In
          </Link>
        </>
      ) : !isValidToken ? (
        <>
          <div className="login-form-header">
            <h2>Validating...</h2>
          </div>

          <div className="flex justify-center py-8">
            <Loader2 size={32} className="login-spinner" />
          </div>
        </>
      ) : success ? (
        <>
          <div className="login-form-header">
            <h2>Password Reset Successful!</h2>
          </div>

          <div className="login-success-alert">
            <CheckCircle size={16} />
            <p>Your password has been updated successfully.</p>
          </div>

          <p className="text-sm text-center text-slate-600 dark:text-slate-400 py-4">
            Redirecting to sign in... If not, click the button below.
          </p>

          <Link href="/login" className="login-submit-btn w-full inline-flex items-center justify-center">
            Go to Sign In
          </Link>
        </>
      ) : (
        <>
          <div className="login-form-header">
            <h2>Reset Password</h2>
            <p>Enter your new password below</p>
          </div>

          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="password">New Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-input-button"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="login-input-button"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-info-box">
              <p className="text-xs font-semibold mb-2">Password requirements:</p>
              <ul className="text-xs space-y-1">
                <li className={password.length >= 6 ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}>
                  ✓ At least 6 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}>
                  ✓ One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}>
                  ✓ One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}>
                  ✓ One number
                </li>
                <li className={password === confirmPassword && confirmPassword ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}>
                  ✓ Passwords match
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="login-spinner" />
                  Updating...
                </>
              ) : (
                <>Reset Password</>
              )}
            </button>
          </form>

          <Link href="/login" className="login-back-link">
            Back to Sign In
          </Link>
        </>
      )}
    </div>
  )
}
