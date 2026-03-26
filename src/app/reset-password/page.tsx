import { Suspense } from 'react'
import Image from 'next/image'
import ResetPasswordForm from './ResetPasswordForm'

function ResetPasswordLoading() {
  return (
    <div className="login-form-wrapper">
      <div className="login-form-header">
        <h2>Loading...</h2>
      </div>
      <div className="flex justify-center py-8">
        <div className="login-spinner" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="login-container">
      {/* Left Panel - Illustration */}
      <div className="login-left-panel">
        <div className="login-illustration-wrapper">
          <Image
            src="https://minimax-algeng-chat-tts-us.oss-us-east-1.aliyuncs.com/ccv2%2F2026-03-26%2FMiniMax-M2.7%2F2029882662956577167%2F741e9e971b6eaa01a6811fbe30e3321c912274fb5ac670c6274cd94e72a1b415..png"
            alt="Delivery Driver"
            fill
            className="login-illustration"
            priority
            quality={90}
          />
        </div>
        <div className="login-left-content">
          <h1 className="login-left-title">Create New Password</h1>
          <p className="login-left-subtitle">
            Secure your account with a strong password
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <Suspense fallback={<ResetPasswordLoading />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
