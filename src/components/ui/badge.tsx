import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          {
            'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200': variant === 'default',
            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400': variant === 'success',
            'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400': variant === 'warning',
            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400': variant === 'danger',
            'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400': variant === 'info',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
