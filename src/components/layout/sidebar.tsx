'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Users,
  BarChart3,
  LogOut,
  ClipboardList,
  ScrollText,
  Wallet,
  Settings,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface SidebarProps {
  role: 'owner' | 'driver'
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const ownerLinks = [
    { href: '/owner', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/owner/drivers', label: 'Karyawan', icon: Users },
    { href: '/owner/reports', label: 'Laporan Harian', icon: FileText },
    { href: '/owner/deposits', label: 'Setoran', icon: DollarSign },
    { href: '/owner/analytics', label: 'Analitik', icon: BarChart3 },
    { href: '/owner/logs', label: 'Log Aktivitas', icon: ScrollText },
    { href: '/owner/settings', label: 'Pengaturan', icon: Settings },
  ]

  const driverLinks = [
    { href: '/driver', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/driver/report', label: 'Isi Laporan', icon: ClipboardList },
    { href: '/driver/reports', label: 'Riwayat Laporan', icon: FileText },
    { href: '/driver/expenses', label: 'Pengeluaran', icon: Wallet },
    { href: '/driver/deposits', label: 'Riwayat Setoran', icon: DollarSign },
  ]

  const links = role === 'owner' ? ownerLinks : driverLinks

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    globalThis.location.href = '/login'
  }

  const sidebarContent = (
    <aside className="w-64 bg-slate-800 dark:bg-slate-900 text-white min-h-screen flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">TRANS RAS</h1>
          <p className="text-xs text-slate-400 mt-1">Manajemen Driver</p>
        </div>
        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link, index) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-64 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
