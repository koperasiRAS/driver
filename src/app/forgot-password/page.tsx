'use client'

import { useState } from 'react'
import Image from 'next/image'
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
          <Image
            src="/illustrations/delivery-driver.png"
            alt="Delivery Driver"
            width={450}
            height={500}
            className="login-illustration"
            priority
            quality={90}
          />
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
