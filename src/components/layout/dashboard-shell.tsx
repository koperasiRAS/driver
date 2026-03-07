'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

interface DashboardShellProps {
  children: React.ReactNode
  userName: string
  role: 'owner' | 'driver'
}

export function DashboardShell({ children, userName, role }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar
        role={role}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Header
          userName={userName}
          role={role}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 bg-slate-50 dark:bg-slate-900 overflow-auto transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
