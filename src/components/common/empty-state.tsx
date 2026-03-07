import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {icon || <FileQuestion className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
