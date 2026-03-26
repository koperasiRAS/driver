import Image from 'next/image'

/**
 * Left panel — illustration displayed as the left half of a split-screen layout.
 * Uses flex layout (no absolute positioning) so it occupies exactly 50% width.
 */
export default function LoginIllustration() {
  return (
    <div className="relative w-full h-screen flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 hidden lg:flex lg:w-1/2 items-center justify-center">
      {/* Decorative background dots */}
      <div className="absolute top-16 right-20 w-4 h-4 rounded-full bg-indigo-400 opacity-40 animate-float-slow" />
      <div className="absolute bottom-32 right-16 w-3 h-3 rounded-full bg-violet-400 opacity-30 animate-float-slower" />
      <div className="absolute top-1/3 left-10 w-2 h-2 rounded-full bg-blue-400 opacity-50 animate-float-slowest" />

      {/* Illustration image — centered, full height visible */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Image
          src="/illustrations/splitscreen terbaru.png"
          alt="Driver App Illustration"
          width={700}
          height={800}
          className="object-contain object-center max-w-full max-h-full"
          priority
        />
      </div>
    </div>
  )
}
