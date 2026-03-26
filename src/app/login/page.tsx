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

  return (
    <div className="login-root">

      {/* ── LEFT PANEL (Desktop only) ── */}
      <div className="login-left">
        <div className="login-left-bg">
          {/* Decorative blurred orbs */}
          <div className="login-orb login-orb-1" />
          <div className="login-orb login-orb-2" />

          <div className="login-left-content">
            <h1 className="login-welcome-title">Welcome<br />Back</h1>
            <p className="login-welcome-sub">
              Please login to your account and start managing your drivers with ease.
            </p>

            {/* Animated car */}
            <div className="login-car-wrapper">
              <svg
                width="300"
                height="130"
                viewBox="0 0 300 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="login-car-svg"
              >
                {/* Exhaust puffs */}
                <circle cx="22" cy="96" r="8" fill="#818cf8" className="login-puff login-puff-1" />
                <circle cx="12" cy="92" r="5.5" fill="#a5b4fc" className="login-puff login-puff-2" />
                <circle cx="4"  cy="89" r="4" fill="#c7d2fe" className="login-puff login-puff-3" />

                {/* Car body */}
                <rect x="20" y="56" width="240" height="40" rx="10" fill="#6366f1" />
                <rect x="20" y="56" width="240" height="12" rx="5" fill="#4f46e5" />

                {/* Cabin */}
                <path d="M75 56 L102 20 L198 20 L228 56Z" fill="#818cf8" />
                <path d="M75 56 L102 20 L198 20 L228 56Z" fill="url(#carWindowGrad)" opacity="0.45" />

                {/* Window shine */}
                <path d="M106 22 L193 22 L223 55 L80 55Z" fill="white" opacity="0.07" />

                {/* Center pillar */}
                <line x1="152" y1="20" x2="152" y2="56" stroke="#6366f1" strokeWidth="3.5" />

                {/* Door divider */}
                <line x1="152" y1="56" x2="152" y2="96" stroke="#4f46e5" strokeWidth="2.5" />

                {/* Door handles */}
                <rect x="115" y="70" width="22" height="5" rx="2.5" fill="#a5b4fc" />
                <rect x="178" y="70" width="22" height="5" rx="2.5" fill="#a5b4fc" />

                {/* Headlights */}
                <rect x="246" y="64" width="14" height="11" rx="3.5" fill="#fef08a" />
                <rect x="248" y="66" width="10" height="7"  rx="2" fill="#fef9c3" opacity="0.95" />

                {/* Front bumper */}
                <rect x="246" y="82" width="18" height="11" rx="5" fill="#4f46e5" />

                {/* Rear light */}
                <rect x="20" y="64" width="11" height="11" rx="3.5" fill="#f87171" />

                {/* Exhaust pipe */}
                <rect x="20" y="90" width="14" height="6" rx="3" fill="#475569" />

                {/* Wheel arches */}
                <circle cx="80"  cy="96" r="24" fill="#1e1b4b" />
                <circle cx="200" cy="96" r="24" fill="#1e1b4b" />

                {/* Wheel 1 */}
                <g className="login-wheel-spin" style={{ transformOrigin: '80px 96px' }}>
                  <circle cx="80"  cy="96" r="19" fill="#374151" />
                  <circle cx="80"  cy="96" r="13" fill="#6b7280" />
                  <circle cx="80"  cy="96" r="5.5" fill="#9ca3af" />
                  <line x1="80"  y1="77" x2="80"  y2="115" stroke="#4b5563" strokeWidth="2.5" />
                  <line x1="61"  y1="96" x2="99"  y2="96"  stroke="#4b5563" strokeWidth="2.5" />
                  <line x1="67"  y1="82" x2="93"  y2="110" stroke="#4b5563" strokeWidth="2.5" />
                  <line x1="93"  y1="82" x2="67"  y2="110" stroke="#4b5563" strokeWidth="2.5" />
                </g>

                {/* Wheel 2 */}
                <g className="login-wheel-spin" style={{ transformOrigin: '200px 96px' }}>
                  <circle cx="200" cy="96" r="19" fill="#374151" />
                  <circle cx="200" cy="96" r="13" fill="#6b7280" />
                  <circle cx="200" cy="96" r="5.5" fill="#9ca3af" />
                  <line x1="200" y1="77" x2="200" y2="115" stroke="#4b5563" strokeWidth="2.5" />
                  <line x1="181" y1="96" x2="219" y2="96"  stroke="#4b5563" strokeWidth="2.5" />
                  <line x1="187" y1="82" x2="213" y2="110" stroke="#4b5563" strokeWidth="2.5" />
                  <line x1="213" y1="82" x2="187" y2="110" stroke="#4b5563" strokeWidth="2.5" />
                </g>

                <defs>
                  <linearGradient id="carWindowGrad" x1="152" y1="20" x2="152" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e0e7ff" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#e0e7ff" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Page indicator dots */}
          <div className="login-dots">
            <div className="login-dot login-dot-passive" />
            <div className="login-dot login-dot-passive" />
            <div className="login-dot login-dot-active" />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form — always visible) ── */}
      <div className="login-right">
        <div className="login-form-container">

          {/* Mobile: logo + branding */}
          <div className="login-mobile-logo">
            <div className="login-mobile-logo-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="20" height="10" rx="3" fill="white" />
                <path d="M6 8 L8.5 3 H15.5 L18 8Z" fill="white" fillOpacity="0.85" />
                <circle cx="7"  cy="18" r="2.5" fill="white" />
                <circle cx="17" cy="18" r="2.5" fill="white" />
              </svg>
            </div>
            <span className="login-mobile-logo-text">TRANS RAS</span>
            <p className="login-mobile-logo-sub">Sistem Manajemen Driver</p>
          </div>

          {/* Form header */}
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in</h2>
            <p className="login-form-subtitle">Sign in to access your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="login-error">
              <AlertCircle className="login-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Fields */}
          <form onSubmit={handleSubmit} className="login-fields">

            <div className="login-field-wrap">
              <Mail className="login-field-icon" />
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="login-input"
              />
            </div>

            <div className="login-field-wrap">
              <Lock className="login-field-icon" />
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="login-input"
              />
            </div>

            <div className="login-row-between">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="login-checkbox"
                />
                Remember me
              </label>
              <a href="#" className="login-forgot-link">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="login-spin-icon" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="login-signup-link">
            Don&apos;t have an account?{' '}
            <span>Sign up</span>
          </p>
        </div>
      </div>

      <style>{`
        .login-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          display: none;
          width: 50%;
          flex-shrink: 0;
        }

        @media (min-width: 1024px) {
          .login-left { display: flex; }
        }

        .login-left-bg {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #4c1d95 100%);
          background-size: 200% 200%;
          animation: loginGradient 7s ease infinite;
        }

        @keyframes loginGradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .login-orb-1 {
          width: 300px; height: 300px;
          background: rgba(99, 102, 241, 0.15);
          top: -80px; left: -80px;
        }
        .login-orb-2 {
          width: 400px; height: 400px;
          background: rgba(139, 92, 246, 0.12);
          bottom: -120px; right: -100px;
        }

        .login-left-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 0 48px;
          width: 100%;
          max-width: 520px;
        }

        .login-welcome-title {
          font-size: 64px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.05;
          margin: 0 0 16px;
          letter-spacing: -1px;
        }

        .login-welcome-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.55);
          margin: 0 0 56px;
          line-height: 1.6;
        }

        .login-car-wrapper {
          display: flex;
          justify-content: center;
          overflow: visible;
          padding: 8px 0;
        }

        .login-car-svg {
          animation: carDriveRight 4s ease-in-out infinite alternate;
        }

        @keyframes carDriveRight {
          0%   { transform: translateX(-130px); }
          100% { transform: translateX(180px); }
        }

        .login-wheel-spin {
          animation: wheelSpinFast 0.45s linear infinite;
          transform-origin: center;
        }

        @keyframes wheelSpinFast {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .login-puff { opacity: 0; transform-origin: center; }
        .login-puff-1 { animation: puffOut 1.4s ease-out infinite 0s; }
        .login-puff-2 { animation: puffOut 1.4s ease-out infinite 0.35s; }
        .login-puff-3 { animation: puffOut 1.4s ease-out infinite 0.7s; }

        @keyframes puffOut {
          0%   { opacity: 0.75; transform: translateX(0) scale(1); }
          100% { opacity: 0;    transform: translateX(-45px) scale(1.8); }
        }

        .login-dots {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-dot {
          border-radius: 99px;
          background: rgba(255,255,255,0.28);
          transition: all 0.3s;
        }

        .login-dot-passive { width: 8px;  height: 8px; }
        .login-dot-active   { width: 20px; height: 8px; background: #818cf8; animation: dotPulseAnim 1.4s ease-in-out infinite; }

        @keyframes dotPulseAnim {
          0%, 100% { opacity: 0.7; transform: scaleX(1); }
          50%       { opacity: 1;   transform: scaleX(1.1); }
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: #ffffff;
          min-height: 100vh;
        }

        @media (min-width: 1024px) {
          .login-right { width: 50%; }
        }

        .login-form-container {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile logo */
        .login-mobile-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }

        @media (min-width: 1024px) {
          .login-mobile-logo { display: none; }
        }

        .login-mobile-logo-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
        }

        .login-mobile-logo-text {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .login-mobile-logo-sub {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0;
        }

        /* Form header */
        .login-form-header { margin-bottom: 28px; }

        .login-form-title {
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .login-form-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Error */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .login-error-icon { width: 16px; height: 16px; flex-shrink: 0; }

        /* Fields */
        .login-fields { display: flex; flex-direction: column; gap: 18px; }

        .login-field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-field-icon {
          position: absolute;
          left: 14px;
          width: 18px;
          height: 18px;
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }

        .login-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 46px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }

        .login-input::placeholder { color: #94a3b8; }

        .login-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .login-row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .login-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }

        .login-checkbox {
          width: 16px; height: 16px;
          border-radius: 4px;
          border: 1.5px solid #cbd5e1;
          accent-color: #6366f1;
          cursor: pointer;
        }

        .login-forgot-link {
          font-size: 14px;
          font-weight: 500;
          color: #6366f1;
          text-decoration: none;
          transition: color 0.15s;
        }

        .login-forgot-link:hover { color: #4f46e5; }

        .login-submit-btn {
          width: 100%;
          height: 48px;
          background: #0d9488;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s;
          margin-top: 4px;
        }

        .login-submit-btn:hover:not(:disabled) { background: #0f766e; }
        .login-submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .login-submit-btn:disabled { background: #5eead4; cursor: not-allowed; }

        .login-spin-icon { animation: spinIcon 0.7s linear infinite; }

        @keyframes spinIcon {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .login-signup-link {
          text-align: center;
          font-size: 14px;
          color: #64748b;
          margin-top: 24px;
        }

        .login-signup-link span {
          color: #6366f1;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s;
        }

        .login-signup-link span:hover { color: #4f46e5; }
      `}</style>
    </div>
  )
}
