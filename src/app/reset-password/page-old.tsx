'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
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

  // Validate and exchange token on mount
  useEffect(() => {
    const validateToken = async () => {
      const code = searchParams.get('code')
      
      if (!code) {
        setTokenError('Invalid or missing reset token. Please request a new password reset.')
        return
      }

      try {
        // Exchange the code for a session
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

    // Validate passwords
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
      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to reset password')
      } else {
        setSuccess(true)
        // Redirect to login after 3 seconds
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
    <div className="login-container">
      {/* Left Panel - Illustration */}
      <div className="login-left-panel">
        <div className="login-illustration-wrapper">
          <svg viewBox="0 0 450 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-illustration">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87ceeb" />
                <stop offset="100%" stopColor="#e0f6ff" />
              </linearGradient>
              <linearGradient id="truckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3498db" />
                <stop offset="100%" stopColor="#2980b9" />
              </linearGradient>
              <radialGradient id="wheelGrad" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#34495e" />
                <stop offset="70%" stopColor="#1a252f" />
                <stop offset="100%" stopColor="#0d141f" />
              </radialGradient>
              <filter id="shadow">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Sky Background */}
            <rect width="450" height="500" fill="url(#skyGrad)" />

            {/* Clouds */}
            <g opacity="0.7">
              <ellipse cx="60" cy="80" rx="45" ry="28" fill="white" />
              <ellipse cx="110" cy="90" rx="55" ry="32" fill="white" />
              <ellipse cx="350" cy="120" rx="50" ry="30" fill="white" />
              <ellipse cx="410" cy="135" rx="60" ry="35" fill="white" />
            </g>

            {/* Sun */}
            <circle cx="380" cy="60" r="35" fill="#ffd700" opacity="0.9" />

            {/* Ground/Road */}
            <rect x="0" y="350" width="450" height="150" fill="#7f8c8d" />
            <line x1="0" y1="380" x2="450" y2="380" stroke="white" strokeWidth="3" strokeDasharray="25,15" opacity="0.6" />

            {/* Truck */}
            <g filter="url(#shadow)">
              <rect x="180" y="220" width="160" height="90" rx="12" fill="url(#truckGrad)" />
              <path d="M 80 270 L 120 200 L 175 200 L 180 270 Z" fill="#2980b9" />
              <circle cx="110" cy="345" r="28" fill="url(#wheelGrad)" />
              <circle cx="240" cy="345" r="28" fill="url(#wheelGrad)" />
              <circle cx="310" cy="345" r="28" fill="url(#wheelGrad)" />
            </g>
          </svg>
        </div>
        <div className="login-left-content">
          <h1 className="login-left-title">Create New Password</h1>
          <p className="login-left-subtitle">
            Secure your account with a strong password
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
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
                {/* New Password */}
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

                {/* Confirm Password */}
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

                {/* Password Requirements */}
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
      </div>
    </div>
  )
}
