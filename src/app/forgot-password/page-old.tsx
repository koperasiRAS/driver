'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email')
      } else {
        setSuccess(true)
        setEmail('')
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
            <circle cx="380" cy="60" r="38" fill="#ffd700" opacity="0.3" />

            {/* Ground/Road */}
            <rect x="0" y="350" width="450" height="150" fill="#7f8c8d" />
            <line x1="0" y1="380" x2="450" y2="380" stroke="white" strokeWidth="3" strokeDasharray="25,15" opacity="0.6" />

            {/* Truck - Simplified */}
            <g filter="url(#shadow)">
              {/* Cargo Container */}
              <rect x="180" y="220" width="160" height="90" rx="12" fill="url(#truckGrad)" />

              {/* Cabin */}
              <path d="M 80 270 L 120 200 L 175 200 L 180 270 Z" fill="#2980b9" />
              <path d="M 95 210 L 165 210 L 170 255 L 90 255 Z" fill="#5dade2" opacity="0.6" />

              {/* Wheels */}
              <circle cx="110" cy="345" r="28" fill="url(#wheelGrad)" filter="url(#shadow)" />
              <circle cx="240" cy="345" r="28" fill="url(#wheelGrad)" filter="url(#shadow)" />
              <circle cx="310" cy="345" r="28" fill="url(#wheelGrad)" filter="url(#shadow)" />
            </g>

            {/* Decorative Elements */}
            <g opacity="0.5">
              <polygon points="30,40 33,48 42,48 35,54 38,62 30,57 22,62 25,54 18,48 27,48" fill="#ffd700" />
              <polygon points="420,90 423,98 432,98 425,104 428,112 420,107 412,112 415,104 408,98 417,98" fill="#ffd700" />
            </g>
          </svg>
        </div>
        <div className="login-left-content">
          <h1 className="login-left-title">Reset Password</h1>
          <p className="login-left-subtitle">
            We'll help you recover access to your account
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <div className="login-form-wrapper">
          {/* Header */}
          <div className="login-form-header">
            <h2>Forgot Password?</h2>
            <p>Enter your email to receive a password reset link</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="login-success-alert">
              <CheckCircle size={16} />
              <div>
                <p className="font-semibold">Recovery email sent!</p>
                <p className="text-sm opacity-90">
                  Check your email for the password reset link. It may take a few minutes to arrive.
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!success ? (
            // Form
            <form onSubmit={handleSubmit} className="login-form">
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
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="login-spinner" />
                    Sending...
                  </>
                ) : (
                  <>Send Recovery Email</>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="login-submit-btn w-full"
              >
                Send Another Email
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="login-info-box">
            <p className="text-sm">
              <strong>Didn't receive the email?</strong> Check your spam folder or verify the email address you registered with.
            </p>
          </div>

          {/* Back to Login */}
          <Link href="/login" className="login-back-link">
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
