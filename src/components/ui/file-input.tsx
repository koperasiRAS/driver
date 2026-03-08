'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  accept?: string
  preview?: string | null
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, label, error, accept = 'image/*', preview, id, onChange, ...props }, ref) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="file"
            id={id}
            accept={accept}
            onChange={handleChange}
            className={cn(
              'w-full h-10 px-3 border rounded-md text-sm transition-all duration-150',
              'file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium',
              'file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
              'disabled:bg-slate-50 disabled:cursor-not-allowed',
              error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {previewUrl && (
          <div className="mt-3">
            <p className="text-sm text-slate-600 mb-2">Preview:</p>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-md border border-slate-200"
            />
          </div>
        )}
      </div>
    )
  }
)

FileInput.displayName = 'FileInput'

export { FileInput }
