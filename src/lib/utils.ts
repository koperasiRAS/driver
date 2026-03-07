import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getCurrentDateInJakarta(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
}

export function getTodayDateString(): string {
  const now = getCurrentDateInJakarta()
  return now.toISOString().split('T')[0]
}

export function isReportDeadlinePassed(): boolean {
  const now = getCurrentDateInJakarta()
  const deadlineHour = 23
  const deadlineMinute = 50

  if (now.getHours() > deadlineHour) return true
  if (now.getHours() === deadlineHour && now.getMinutes() >= deadlineMinute) return true
  return false
}

export function isDeadlineWarning(): boolean {
  const now = getCurrentDateInJakarta()
  const warningHour = 23
  const warningMinute = 30

  if (now.getHours() > warningHour) return true
  if (now.getHours() === warningHour && now.getMinutes() >= warningMinute) return true
  return false
}

export function canEditReport(submittedAt: string): boolean {
  const submitted = new Date(submittedAt)
  const now = getCurrentDateInJakarta()
  const hoursDiff = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60)
  return hoursDiff < 2
}

export function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    libur: 'Libur',
    sakit: 'Sakit',
    vehicle_issue: 'Kendaraan Rusak',
    no_orders: 'Tidak Ada Order',
    personal_matter: 'Urusan Pribadi',
    other: 'Lainnya',
  }
  return labels[reason] || reason
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    lalamove: 'Lalamove',
    direct_call: 'Telepon Langsung',
    mixed: 'Campuran',
  }
  return labels[platform] || platform
}

export function getDepositMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Tunai',
    transfer: 'Transfer',
  }
  return labels[method] || method
}
