'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { signIn } from '@/services/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.profile) {
      if (result.profile.role === 'owner') {
        router.push('/owner')
      } else {
        router.push('/driver')
      }
    }

    setLoading(false)
  }

  return (
    <div className="login-container">
      {/* Left Panel - Professional Illustration */}
      <div className="login-left-panel">
        <div className="login-illustration-wrapper">
          <Image
            src="/illustrations/delivery-driver.jpg"
            alt="Delivery Driver with Truck"
            width={450}
            height={500}
            className="login-illustration"
            priority
            quality={90}
          />
        </div>
        <div className="login-left-content">
          <h1 className="login-left-title">Welcome Back</h1>
          <p className="login-left-subtitle">
            Manage your drivers and fleet with ease
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <div className="login-form-wrapper">
          {/* Logo - Mobile only */}
          <div className="login-logo-mobile">
            <div className="login-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="20" height="10" rx="3" fill="currentColor" />
                <path d="M6 8 L8.5 3 H15.5 L18 8Z" fill="currentColor" opacity="0.8" />
                <circle cx="7" cy="18" r="2.5" fill="currentColor" />
                <circle cx="17" cy="18" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="login-logo-text">TRANS RAS</div>
              <div className="login-logo-subtitle">Driver Management</div>
            </div>
          </div>

          {/* Form Header */}
          <div className="login-form-header">
            <h2>Sign In</h2>
            <p>Access your driver management account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
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
                  autoComplete="email"
                  className="login-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="login-input"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="login-forgot-link">
                Forgot password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <p className="login-signup-prompt">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="login-signup-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
