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

  const handleSubmit = async (e: React.SubmitEvent) => {
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
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.25" />
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Sky Background */}
            <rect width="450" height="500" fill="url(#skyGrad)" />

            {/* Clouds - Left */}
            <g opacity="0.7">
              <ellipse cx="60" cy="80" rx="45" ry="28" fill="white" />
              <ellipse cx="110" cy="90" rx="55" ry="32" fill="white" />
              <ellipse cx="30" cy="100" rx="40" ry="25" fill="white" opacity="0.8" />
            </g>

            {/* Clouds - Right */}
            <g opacity="0.5">
              <ellipse cx="350" cy="120" rx="50" ry="30" fill="white" />
              <ellipse cx="410" cy="135" rx="60" ry="35" fill="white" />
              <ellipse cx="320" cy="150" rx="45" ry="28" fill="white" opacity="0.7" />
            </g>

            {/* Sun */}
            <circle cx="380" cy="60" r="35" fill="#ffd700" opacity="0.9" />
            <circle cx="380" cy="60" r="38" fill="#ffd700" opacity="0.3" />

            {/* Ground/Road */}
            <rect x="0" y="350" width="450" height="150" fill="#7f8c8d" />
            <line x1="0" y1="380" x2="450" y2="380" stroke="white" strokeWidth="3" strokeDasharray="25,15" opacity="0.6" />

            {/* Truck - Main Body */}
            <g filter="url(#shadow)">
              {/* Cargo Container */}
              <rect x="180" y="220" width="160" height="90" rx="12" fill="url(#truckGrad)" />
              <rect x="188" y="228" width="144" height="80" rx="10" fill="white" opacity="0.12" />

              {/* Container Details - Lines */}
              <line x1="190" y1="240" x2="330" y2="240" stroke="#1a5fa0" strokeWidth="1" opacity="0.5" />
              <line x1="190" y1="260" x2="330" y2="260" stroke="#1a5fa0" strokeWidth="1" opacity="0.5" />
              <line x1="190" y1="280" x2="330" y2="280" stroke="#1a5fa0" strokeWidth="1" opacity="0.5" />

              {/* Cabin - Main */}
              <path d="M 80 270 L 120 200 L 175 200 L 180 270 Z" fill="#2980b9" />
              <rect x="82" y="260" width="95" height="22" rx="2" fill="#3498db" />

              {/* Windshield */}
              <path d="M 95 210 L 165 210 L 170 255 L 90 255 Z" fill="#5dade2" opacity="0.6" filter="url(#glow)" />
              <path d="M 100 220 L 160 220 L 163 250 L 97 250 Z" fill="white" opacity="0.2" />

              {/* Left Side Mirror */}
              <rect x="75" y="235" width="8" height="20" rx="2" fill="#34495e" />
              <rect x="72" y="235" width="6" height="16" rx="1" fill="#5dade2" />

              {/* Headlights */}
              <circle cx="175" cy="245" r="6" fill="#ffd700" opacity="0.9" />
              <circle cx="175" cy="255" r="5" fill="#e74c3c" opacity="0.8" />

              {/* Bumper */}
              <rect x="175" y="260" width="15" height="18" rx="3" fill="#34495e" />
              <rect x="177" y="262" width="11" height="14" rx="2" fill="#2c3e50" />

              {/* Door Handle */}
              <rect x="130" y="248" width="18" height="6" rx="2" fill="#95a5a6" />

              {/* Side Vents */}
              <rect x="110" y="250" width="3" height="15" fill="#1a5fa0" opacity="0.7" />
              <rect x="118" y="250" width="3" height="15" fill="#1a5fa0" opacity="0.7" />

              {/* Exhaust Pipe */}
              <rect x="75" y="280" width="8" height="25" rx="2" fill="#5d6d7b" />
              <circle cx="79" cy="308" r="6" fill="#7f8c8d" />

              {/* Wheels - Front */}
              <g filter="url(#shadow)">
                <circle cx="110" cy="345" r="28" fill="url(#wheelGrad)" />
                <circle cx="110" cy="345" r="20" fill="#34495e" />
                <circle cx="110" cy="345" r="14" fill="#1a252f" />
                <circle cx="110" cy="345" r="8" fill="#2c3e50" />
                <circle cx="110" cy="340" r="4" fill="white" opacity="0.4" />
                <line x1="110" y1="317" x2="110" y2="373" stroke="#7f8c8d" strokeWidth="1.5" opacity="0.3" />
                <line x1="82" y1="345" x2="138" y2="345" stroke="#7f8c8d" strokeWidth="1.5" opacity="0.3" />
                <line x1="87" y1="322" x2="133" y2="368" stroke="#7f8c8d" strokeWidth="1" opacity="0.2" />
                <line x1="133" y1="322" x2="87" y2="368" stroke="#7f8c8d" strokeWidth="1" opacity="0.2" />
              </g>

              {/* Wheels - Middle Rear */}
              <g filter="url(#shadow)">
                <circle cx="240" cy="345" r="28" fill="url(#wheelGrad)" />
                <circle cx="240" cy="345" r="20" fill="#34495e" />
                <circle cx="240" cy="345" r="14" fill="#1a252f" />
                <circle cx="240" cy="345" r="8" fill="#2c3e50" />
                <circle cx="240" cy="340" r="4" fill="white" opacity="0.4" />
                <line x1="240" y1="317" x2="240" y2="373" stroke="#7f8c8d" strokeWidth="1.5" opacity="0.3" />
                <line x1="212" y1="345" x2="268" y2="345" stroke="#7f8c8d" strokeWidth="1.5" opacity="0.3" />
                <line x1="217" y1="322" x2="263" y2="368" stroke="#7f8c8d" strokeWidth="1" opacity="0.2" />
                <line x1="263" y1="322" x2="217" y2="368" stroke="#7f8c8d" strokeWidth="1" opacity="0.2" />
              </g>

              {/* Wheels - Rear */}
              <g filter="url(#shadow)">
                <circle cx="310" cy="345" r="28" fill="url(#wheelGrad)" />
                <circle cx="310" cy="345" r="20" fill="#34495e" />
                <circle cx="310" cy="345" r="14" fill="#1a252f" />
                <circle cx="310" cy="345" r="8" fill="#2c3e50" />
                <circle cx="310" cy="340" r="4" fill="white" opacity="0.4" />
                <line x1="310" y1="317" x2="310" y2="373" stroke="#7f8c8d" strokeWidth="1.5" opacity="0.3" />
                <line x1="282" y1="345" x2="338" y2="345" stroke="#7f8c8d" strokeWidth="1.5" opacity="0.3" />
                <line x1="287" y1="322" x2="333" y2="368" stroke="#7f8c8d" strokeWidth="1" opacity="0.2" />
                <line x1="333" y1="322" x2="287" y2="368" stroke="#7f8c8d" strokeWidth="1" opacity="0.2" />
              </g>

              {/* Exhaust Smoke - Subtle */}
              <circle cx="79" cy="300" r="8" fill="#bdc3c7" opacity="0.3" />
              <circle cx="75" cy="290" r="6" fill="#bdc3c7" opacity="0.2" />
            </g>

            {/* Driver Figure - Waving */}
            <g filter="url(#shadow)">
              {/* Head */}
              <circle cx="150" cy="185" r="14" fill="#f4a460" />
              {/* Hair */}
              <path d="M 136 180 Q 150 170 164 180" fill="#8b4513" opacity="0.7" />
              {/* Eyes */}
              <circle cx="145" cy="182" r="2" fill="#000" />
              <circle cx="155" cy="182" r="2" fill="#000" />
              {/* Smile */}
              <path d="M 147 190 Q 150 192 153 190" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Body */}
              <ellipse cx="150" cy="210" rx="12" ry="20" fill="#e74c3c" />
              {/* Shirt detail */}
              <rect x="140" y="205" width="20" height="3" fill="#c0392b" />

              {/* Left Arm */}
              <rect x="125" y="208" width="18" height="8" rx="4" fill="#f4a460" />

              {/* Right Arm - Waving */}
              <g>
                <rect x="157" y="200" width="8" height="22" rx="4" fill="#f4a460" />
                <circle cx="162" cy="195" r="7" fill="#f4a460" />
                {/* Waving Hand Motion */}
                <path d="M 162 195 L 175 185 L 172 200" fill="#f4a460" opacity="0.8" />
              </g>

              {/* Legs */}
              <rect x="145" y="230" width="6" height="18" rx="2" fill="#34495e" />
              <rect x="155" y="230" width="6" height="18" rx="2" fill="#34495e" />
              {/* Shoes */}
              <ellipse cx="148" cy="250" rx="5" ry="4" fill="#2c3e50" />
              <ellipse cx="158" cy="250" rx="5" ry="4" fill="#2c3e50" />
            </g>

            {/* Decorative Stars */}
            <g opacity="0.5">
              <polygon points="30,40 33,48 42,48 35,54 38,62 30,57 22,62 25,54 18,48 27,48" fill="#ffd700" />
              <polygon points="420,90 423,98 432,98 425,104 428,112 420,107 412,112 415,104 408,98 417,98" fill="#ffd700" />
            </g>
          </svg>
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
