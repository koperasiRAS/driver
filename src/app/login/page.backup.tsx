'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
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

  const DriverIllustration = () => (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-illustration">
      {/* Sky background */}
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id="carGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <radialGradient id="wheelGrad" cx="50%" cy="35%">
          <stop offset="0%" stopColor="#2d3748" />
          <stop offset="60%" stopColor="#1a202c" />
          <stop offset="100%" stopColor="#0f1419" />
        </radialGradient>
        <radialGradient id="tireMatte" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        <filter id="wheelShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>
      
      <rect width="400" height="400" fill="url(#skyGrad)" />
      
      {/* Clouds */}
      <g opacity="0.6" className="cloud-float">
        <ellipse cx="80" cy="60" rx="35" ry="20" fill="white" />
        <ellipse cx="110" cy="65" rx="40" ry="22" fill="white" />
        <ellipse cx="50" cy="70" rx="30" ry="18" fill="white" />
      </g>
      
      <g opacity="0.4" className="cloud-float cloud-delay-1">
        <ellipse cx="300" cy="100" rx="38" ry="21" fill="white" />
        <ellipse cx="335" cy="105" rx="42" ry="23" fill="white" />
        <ellipse cx="265" cy="115" rx="32" ry="19" fill="white" />
      </g>

      {/* Road */}
      <rect x="20" y="280" width="360" height="100" fill="#64748b" />
      <line x1="20" y1="330" x2="380" y2="330" stroke="white" strokeWidth="2" strokeDasharray="20,10" opacity="0.6" />
      
      {/* Truck Body */}
      <g className="truck-animation">
        {/* Main cargo area */}
        <rect x="160" y="200" width="140" height="65" rx="8" fill="url(#carGrad)" />
        
        {/* Cargo interior shading */}
        <rect x="165" y="205" width="130" height="55" rx="6" fill="white" opacity="0.15" />
        
        {/* Cabin */}
        <path d="M 80 220 L 110 180 L 155 180 L 160 220 Z" fill="#0284c7" />
        <path d="M 85 215 L 155 215 L 155 220 L 85 220 Z" fill="#0ea5e9" />
        
        {/* Windshield */}
        <path d="M 95 190 L 145 190 L 145 210 L 95 210 Z" fill="#60a5fa" opacity="0.4" />
        <path d="M 100 195 L 140 195 L 140 208 L 100 208 Z" fill="white" opacity="0.2" />
        
        {/* Headlights */}
        <rect x="155" y="210" width="8" height="8" rx="2" fill="#fbbf24" opacity="0.8" />
        <rect x="155" y="222" width="8" height="6" rx="1.5" fill="#ef4444" opacity="0.8" />
        
        {/* Door handle */}
        <rect x="120" y="215" width="12" height="4" rx="2" fill="#94a3b8" />
        
        {/* Wheels - Pixar Style */}
        {/* Front Wheel */}
        <g className="wheel-spin" filter="url(#wheelShadow)">
          {/* Outer tire */}
          <circle cx="110" cy="270" r="22" fill="url(#tireMatte)" />
          
          {/* Rim/Hub shine */}
          <circle cx="110" cy="270" r="18" fill="url(#wheelGrad)" />
          <circle cx="110" cy="270" r="10" fill="#1a1a1a" />
          
          {/* Center cap shine */}
          <circle cx="110" cy="270" r="5.5" fill="#3d3d3d" />
          <circle cx="110" cy="268" r="3" fill="white" opacity="0.3" />
          
          {/* Spokes - subtle and clean */}
          <line x1="110" y1="248" x2="110" y2="292" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="88" y1="270" x2="132" y2="270" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="96" y1="256" x2="124" y2="284" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="124" y1="256" x2="96" y2="284" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
        </g>
        
        {/* Rear Wheel 1 */}
        <g className="wheel-spin" filter="url(#wheelShadow)">
          {/* Outer tire */}
          <circle cx="230" cy="270" r="22" fill="url(#tireMatte)" />
          
          {/* Rim/Hub shine */}
          <circle cx="230" cy="270" r="18" fill="url(#wheelGrad)" />
          <circle cx="230" cy="270" r="10" fill="#1a1a1a" />
          
          {/* Center cap shine */}
          <circle cx="230" cy="270" r="5.5" fill="#3d3d3d" />
          <circle cx="230" cy="268" r="3" fill="white" opacity="0.3" />
          
          {/* Spokes */}
          <line x1="230" y1="248" x2="230" y2="292" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="208" y1="270" x2="252" y2="270" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="216" y1="256" x2="244" y2="284" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="244" y1="256" x2="216" y2="284" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
        </g>
        
        {/* Rear Wheel 2 */}
        <g className="wheel-spin" filter="url(#wheelShadow)">
          {/* Outer tire */}
          <circle cx="280" cy="270" r="22" fill="url(#tireMatte)" />
          
          {/* Rim/Hub shine */}
          <circle cx="280" cy="270" r="18" fill="url(#wheelGrad)" />
          <circle cx="280" cy="270" r="10" fill="#1a1a1a" />
          
          {/* Center cap shine */}
          <circle cx="280" cy="270" r="5.5" fill="#3d3d3d" />
          <circle cx="280" cy="268" r="3" fill="white" opacity="0.3" />
          
          {/* Spokes */}
          <line x1="280" y1="248" x2="280" y2="292" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="258" y1="270" x2="302" y2="270" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="266" y1="256" x2="294" y2="284" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
          <line x1="294" y1="256" x2="266" y2="284" stroke="#0f1419" strokeWidth="1.5" opacity="0.4" />
        </g>
        
        {/* Exhaust pipe */}
        <rect x="75" y="265" width="6" height="12" rx="2" fill="#475569" />
        
        {/* Exhaust fumes */}
        <circle cx="78" cy="260" r="4.5" fill="#a3a3a3" opacity="0.6" className="puff-animation puff-1" />
        <circle cx="78" cy="253" r="3" fill="#a3a3a3" opacity="0.4" className="puff-animation puff-2" />
      </g>

      {/* Driver figure (simplified) */}
      <g className="driver-wave">
        {/* Head */}
        <circle cx="195" cy="160" r="10" fill="#fbbf24" />
        
        {/* Body */}
        <rect x="191" y="172" width="8" height="16" rx="2" fill="#3b82f6" />
        
        {/* Arms */}
        <line x1="191" y1="176" x2="170" y2="165" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="199" y1="176" x2="225" y2="165" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="wave-arm" />
        
        {/* Legs */}
        <line x1="193" y1="188" x2="190" y2="202" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="197" y1="188" x2="200" y2="202" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Decorative elements */}
      <g opacity="0.3">
        <circle cx="320" cy="140" r="3" fill="#0ea5e9" />
        <circle cx="350" cy="120" r="2" fill="#0ea5e9" />
        <circle cx="60" cy="280" r="2.5" fill="#0ea5e9" />
      </g>
    </svg>
  )

  return (
    <div className="login-container">
      {/* Left Panel - Illustration (Hidden on mobile) */}
      <div className="login-left-panel">
        <div className="login-illustration-wrapper">
          <DriverIllustration />
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
              <a href="#" className="login-forgot-link">Forgot password?</a>
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
                'Sign In'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <p className="login-signup-prompt">
            Don&apos;t have an account?{' '}
            <a href="#" className="login-signup-link">Create one</a>
          </p>
        </div>
      </div>
    </div>
  )
}
