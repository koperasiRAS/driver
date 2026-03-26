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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col items-center justify-center
        bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950
        animate-gradient relative overflow-hidden">

        {/* decorative circles */}
        <div className="absolute top-16 left-16 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 text-center px-12 max-w-md">
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Welcome<br />Back
          </h1>
          <p className="text-white/60 text-base mb-20">
            Please login to your account and start managing your drivers with ease.
          </p>

          {/* Animated car SVG */}
          <div className="flex justify-center overflow-hidden">
            <svg
              width="280"
              height="120"
              viewBox="0 0 280 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-car-drive"
            >
              {/* Exhaust puffs */}
              <circle cx="28" cy="88" r="7" fill="#818cf8" className="animate-puff" style={{ animationDelay: '0s' }} />
              <circle cx="18" cy="85" r="5" fill="#a5b4fc" className="animate-puff" style={{ animationDelay: '0.4s' }} />
              <circle cx="10" cy="83" r="3.5" fill="#c7d2fe" className="animate-puff" style={{ animationDelay: '0.8s' }} />

              {/* Car body */}
              <rect x="20" y="50" width="220" height="38" rx="8" fill="#6366f1" />
              <rect x="20" y="50" width="220" height="10" rx="4" fill="#4f46e5" />

              {/* Cabin / roof */}
              <path d="M70 50 L95 18 L185 18 L215 50Z" fill="#818cf8" />
              <path d="M70 50 L95 18 L185 18 L215 50Z" fill="url(#windowGrad)" opacity="0.5" />

              {/* Window shine */}
              <path d="M99 20 L183 20 L210 49 L74 49Z" fill="white" opacity="0.08" />

              {/* Front windshield divider */}
              <line x1="143" y1="18" x2="143" y2="50" stroke="#6366f1" strokeWidth="3" />

              {/* Door line */}
              <line x1="143" y1="50" x2="143" y2="88" stroke="#4f46e5" strokeWidth="2" />

              {/* Door handle */}
              <rect x="110" y="63" width="20" height="5" rx="2.5" fill="#a5b4fc" />
              <rect x="165" y="63" width="20" height="5" rx="2.5" fill="#a5b4fc" />

              {/* Headlight */}
              <rect x="226" y="57" width="14" height="10" rx="3" fill="#fef08a" />
              <rect x="228" y="59" width="10" height="6" rx="2" fill="#fef9c3" opacity="0.9" />

              {/* Front bumper */}
              <rect x="225" y="74" width="18" height="10" rx="4" fill="#4f46e5" />

              {/* Rear light */}
              <rect x="20" y="57" width="10" height="10" rx="3" fill="#f87171" />

              {/* Tail pipe */}
              <rect x="20" y="82" width="12" height="5" rx="2" fill="#475569" />

              {/* Wheel wells */}
              <circle cx="75" cy="88" r="22" fill="#1e1b4b" />
              <circle cx="185" cy="88" r="22" fill="#1e1b4b" />

              {/* Wheel 1 */}
              <g className="animate-wheel-spin" style={{ transformOrigin: '75px 88px' }}>
                <circle cx="75" cy="88" r="18" fill="#374151" />
                <circle cx="75" cy="88" r="12" fill="#6b7280" />
                <circle cx="75" cy="88" r="5"  fill="#9ca3af" />
                {/* Spokes */}
                <line x1="75" y1="70" x2="75" y2="106" stroke="#4b5563" strokeWidth="2.5" />
                <line x1="57" y1="88" x2="93" y2="88"  stroke="#4b5563" strokeWidth="2.5" />
                <line x1="62" y1="75" x2="88" y2="101" stroke="#4b5563" strokeWidth="2.5" />
                <line x1="88" y1="75" x2="62" y2="101" stroke="#4b5563" strokeWidth="2.5" />
              </g>

              {/* Wheel 2 */}
              <g className="animate-wheel-spin" style={{ transformOrigin: '185px 88px' }}>
                <circle cx="185" cy="88" r="18" fill="#374151" />
                <circle cx="185" cy="88" r="12" fill="#6b7280" />
                <circle cx="185" cy="88" r="5"  fill="#9ca3af" />
                {/* Spokes */}
                <line x1="185" y1="70" x2="185" y2="106" stroke="#4b5563" strokeWidth="2.5" />
                <line x1="167" y1="88" x2="203" y2="88"  stroke="#4b5563" strokeWidth="2.5" />
                <line x1="172" y1="75" x2="198" y2="101" stroke="#4b5563" strokeWidth="2.5" />
                <line x1="198" y1="75" x2="172" y2="101" stroke="#4b5563" strokeWidth="2.5" />
              </g>

              <defs>
                <linearGradient id="windowGrad" x1="143" y1="18" x2="143" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e0e7ff" stopOpacity="0.6" />
                  <stop offset="1" stopColor="#e0e7ff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Bottom dots */}
        <div className="absolute bottom-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-5 h-2 rounded-full bg-indigo-400 animate-dot-pulse" />
        </div>
      </div>

      {/* ── RIGHT PANEL (FORM) ── */}
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="20" height="10" rx="3" fill="white" />
                <path d="M6 8 L8.5 3 H15.5 L18 8Z" fill="white" fillOpacity="0.8" />
                <circle cx="7" cy="18" r="2.5" fill="white" />
                <circle cx="17" cy="18" r="2.5" fill="white" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">TRANS RAS</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Manajemen Driver</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Sign in</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to access your account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                  text-sm text-slate-900 dark:text-white placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-150"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                  text-sm text-slate-900 dark:text-white placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-150"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white font-medium rounded-lg
                transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <span className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium cursor-pointer">
              Sign up
            </span>
          </p>

        </div>
      </div>

    </div>
  )
}
