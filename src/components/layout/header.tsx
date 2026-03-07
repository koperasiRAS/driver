'use client'

import { User, Truck, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { NotificationBell } from '@/components/layout/notification-bell'

interface HeaderProps {
  userName: string
  role: 'owner' | 'driver'
  onMenuToggle?: () => void
}

export function Header({ userName, role, onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 md:py-4 transition-colors duration-300 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Hamburger for mobile */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          {role === 'owner' ? (
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400 hidden sm:block" />
          ) : (
            <Truck className="w-5 h-5 text-teal-600 dark:text-teal-400 hidden sm:block" />
          )}
          <div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Selamat datang,</p>
            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white">{userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>
          <NotificationBell role={role} />
          <span className="text-xs text-slate-500 dark:text-slate-400 capitalize px-2 md:px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full hidden sm:inline">
            {role === 'owner' ? 'Pemilik' : 'Driver'}
          </span>
        </div>
      </div>
    </header>
  )
}
