'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
          <Image
            src="https://minimax-algeng-chat-tts-us.oss-us-east-1.aliyuncs.com/ccv2%2F2026-03-26%2FMiniMax-M2.7%2F2029882662956577167%2F741e9e971b6eaa01a6811fbe30e3321c912274fb5ac670c6274cd94e72a1b415..png"
            alt="Delivery Driver"
            fill
            className="login-illustration"
            priority
            quality={90}
          />
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
