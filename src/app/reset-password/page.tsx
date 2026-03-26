import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

function ResetPasswordLoading() {
  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6 sm:p-8">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl mb-3 animate-pulse">
          <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat...</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background illustration — same as login page */}
      <div
        className="absolute inset-0 -z-0 bg-no-repeat bg-cover bg-right"
        style={{ backgroundImage: "url('/illustrations/splitscreen terbaru.png')" }}
      />

      {/* Full dark overlay */}
      <div className="absolute inset-0 -z-[1] bg-black/65" />

      {/* Taglines on left background — hidden on mobile */}
      <div className="hidden sm:block absolute left-0 top-0 z-20 h-full w-3/5 md:w-1/2 pointer-events-none">
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
          <h2
            className="text-white font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-4 sm:mb-5"
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}
          >
            Buat Password Baru
            <br className="hidden sm:block" />
            yang Kuat
          </h2>
          <p
            className="text-white/90 font-semibold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            Amankan akun Anda dengan langkah mudah
          </p>
          <div
            className="w-20 sm:w-24 md:w-28 h-1.5 md:h-2 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full mt-6 sm:mt-8 md:mt-10"
            style={{ boxShadow: '0 0 16px rgba(99,102,241,0.7)' }}
          />
        </div>
      </div>

      {/* Form — right side desktop, centered mobile */}
      <div className="relative z-30 flex min-h-screen w-full items-center justify-end sm:justify-end px-4 py-10 sm:px-8 md:px-12 lg:px-16">
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] lg:max-w-[420px]">
          <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
