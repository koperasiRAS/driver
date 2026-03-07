'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: 'report' | 'deposit' | 'driver'
  title: string
  message: string
  time: string
  read: boolean
}

export function NotificationBell({ role }: { role: 'owner' | 'driver' }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (role !== 'owner') return
    
    const supabase = createClient()

    const fetchRecent = async () => {
      const newNotifs: Notification[] = []

      // Fetch recent pending deposits
      try {
        const { data: deposits } = await supabase
          .from('deposits')
          .select('id, amount, created_at, driver:drivers(profile:profiles(full_name))')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)

        deposits?.forEach((d: Record<string, unknown>) => {
          const driver = d.driver as Record<string, unknown> | null
          const profile = driver?.profile as Record<string, unknown> | null
          newNotifs.push({
            id: `deposit-${d.id}`,
            type: 'deposit',
            title: 'Setoran Baru',
            message: `${profile?.full_name || 'Driver'} mengirim setoran Rp ${Number(d.amount).toLocaleString('id-ID')}`,
            time: d.created_at as string,
            read: false,
          })
        })
      } catch { /* ignore */ }

      // Fetch today's reports
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data: reports } = await supabase
          .from('daily_reports')
          .select('id, status, submitted_at, driver:drivers(profile:profiles(full_name))')
          .eq('report_date', today)
          .order('submitted_at', { ascending: false })
          .limit(5)

        reports?.forEach((r: Record<string, unknown>) => {
          const driver = r.driver as Record<string, unknown> | null
          const profile = driver?.profile as Record<string, unknown> | null
          newNotifs.push({
            id: `report-${r.id}`,
            type: 'report',
            title: 'Laporan Harian',
            message: `${profile?.full_name || 'Driver'} - ${r.status === 'narik' ? 'Narik' : 'Tidak Narik'}`,
            time: r.submitted_at as string,
            read: false,
          })
        })
      } catch { /* ignore */ }

      // Sort by time
      newNotifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setNotifications(newNotifs.slice(0, 10))
    }

    fetchRecent()

    // Real-time subscriptions
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deposits' }, () => fetchRecent())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_reports' }, () => fetchRecent())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [role])

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (role !== 'owner') return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead() }}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 animate-fade-in overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notifikasi</h3>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-700">Tandai dibaca</button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Tidak ada notifikasi</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${!n.read ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      n.type === 'deposit' ? 'bg-emerald-500' : n.type === 'report' ? 'bg-blue-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(n.time)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
