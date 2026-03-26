'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, Users } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'driver' | 'owner'>('driver')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

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

    // Validate inputs
    if (!fullName.trim()) {
      setError('Please enter your full name')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

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
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account')
      } else if (data.user) {
        // Create profile in database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              email: email,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Account created but profile failed - still show success
        }

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
              {/* Cargo Container */}
              <rect x="180" y="220" width="160" height="90" rx="12" fill="url(#truckGrad)" />
              <rect x="188" y="228" width="144" height="80" rx="10" fill="white" opacity="0.12" />

              {/* Cabin */}
              <path d="M 80 270 L 120 200 L 175 200 L 180 270 Z" fill="#2980b9" />
              <path d="M 95 210 L 165 210 L 170 255 L 90 255 Z" fill="#5dade2" opacity="0.6" />

              {/* Headlights */}
              <circle cx="175" cy="245" r="6" fill="#ffd700" opacity="0.9" />
              <circle cx="175" cy="255" r="5" fill="#e74c3c" opacity="0.8" />

              {/* Wheels */}
              <circle cx="110" cy="345" r="28" fill="url(#wheelGrad)" />
              <circle cx="240" cy="345" r="28" fill="url(#wheelGrad)" />
              <circle cx="310" cy="345" r="28" fill="url(#wheelGrad)" />
            </g>

            {/* Decorative Stars */}
            <g opacity="0.5">
              <polygon points="30,40 33,48 42,48 35,54 38,62 30,57 22,62 25,54 18,48 27,48" fill="#ffd700" />
              <polygon points="420,90 423,98 432,98 425,104 428,112 420,107 412,112 415,104 408,98 417,98" fill="#ffd700" />
            </g>
          </svg>
        </div>
        <div className="login-left-content">
          <h1 className="login-left-title">Join TRANS RAS</h1>
          <p className="login-left-subtitle">
            Start managing your fleet today
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <div className="login-form-wrapper">
          {/* Header */}
          <div className="login-form-header">
            <h2>Create Account</h2>
            <p>Join our driver management system</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <>
              <div className="login-success-alert">
                <AlertCircle size={16} />
                <div>
                  <p className="font-semibold">Account created successfully!</p>
                  <p className="text-sm opacity-90">
                    Check your email to verify your account. Redirecting to login...
                  </p>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {/* Full Name */}
              <div className="login-field">
                <label htmlFor="fullName">Full Name</label>
                <div className="login-input-wrapper">
                  <User size={18} className="login-input-icon" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="login-input"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="login-field">
                <label htmlFor="email">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail size={18} className="login-input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="login-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
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
                    required
                    disabled={loading}
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

              {/* Role Selection */}
              <div className="login-field">
                <label>Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    disabled={loading}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center gap-2 justify-center ${
                      role === 'driver'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <User size={16} />
                    Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    disabled={loading}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center gap-2 justify-center ${
                      role === 'owner'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Users size={16} />
                    Owner
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="login-info-box">
                <p className="text-xs font-semibold mb-2">Password must contain:</p>
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
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="login-spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <p className="login-signup-prompt">
            Already have an account?{' '}
            <Link href="/login" className="login-signup-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
