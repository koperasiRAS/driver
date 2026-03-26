import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background illustration */}
      <div
        className="absolute inset-0 -z-0 bg-no-repeat bg-cover bg-right"
        style={{
          backgroundImage: "url('/illustrations/splitscreen terbaru.png')",
        }}
      />

      {/* Full dark overlay — covers entire background uniformly */}
      <div className="absolute inset-0 -z-[1] bg-black/65" />

      {/* Taglines on the LEFT background area — HIDDEN on mobile, VISIBLE on tablet+ */}
      {/* No extra strip needed since full overlay is already dark */}
      <div className="hidden sm:block absolute left-0 top-0 z-20 h-full w-3/5 md:w-1/2 pointer-events-none">
        {/* Tagline content */}
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
          {/* Main tagline - VERY LARGE */}
          <h2
            className="text-white font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-4 sm:mb-5"
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}
          >
            Solusi Transportasi Terpercaya
            <br className="hidden sm:block" />
            untuk Bisnis Anda
          </h2>

          {/* Sub tagline */}
          <p
            className="text-white/90 font-semibold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            Mengelola Armada, Membangun Masa Depan
          </p>

          {/* Decorative line */}
          <div
            className="w-20 sm:w-24 md:w-28 h-1.5 md:h-2 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full mt-6 sm:mt-8 md:mt-10"
            style={{ boxShadow: '0 0 16px rgba(99,102,241,0.7)' }}
          />
        </div>
      </div>

      {/* Layout: form di kanan (desktop/tablet), centered (mobile) */}
      <div className="relative z-30 flex min-h-screen w-full items-center justify-end sm:justify-end px-4 py-10 sm:px-8 md:px-12 lg:px-16">
        {/* Form card */}
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] lg:max-w-[420px]">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
