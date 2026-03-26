'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Truck } from 'lucide-react'
import Link from 'next/link'
import { signIn } from '@/services/auth'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8">
      {/* Company Branding Header */}
      <div className="text-center mb-6 sm:mb-8">
        {/* Logo Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg mb-4">
          <Truck size={28} className="text-white" />
        </div>

        {/* Company Name */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Trans RAS
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          by <span className="text-indigo-600 font-semibold">Koperasi Raya Abadi Saudara</span>
        </p>
      </div>

      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-xs sm:text-sm text-gray-500">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm mb-4 sm:mb-5 bg-red-50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        {/* Email field */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <label htmlFor="email" className="text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] sm:text-xs text-gray-500 hover:text-indigo-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 sm:h-12 mt-4 sm:mt-5 bg-linear-to-r from-violet-700 to-indigo-700 text-white font-semibold rounded-xl hover:from-violet-800 hover:to-indigo-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </div>
  )
}
