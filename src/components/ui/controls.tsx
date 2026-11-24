import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
        outline: 'border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-blue-50',
        ghost: 'text-[var(--primary)] hover:bg-blue-50',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({ variant, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={twMerge(clsx(buttonVariants({ variant }), className))} {...props} />
}

const badgeVariants = cva('badge', {
  variants: { tone: { blue: 'badge-blue', gray: 'badge-gray', amber: 'badge-amber', green: 'badge-green' } },
  defaultVariants: { tone: 'gray' },
})

export function Badge({ tone, children }: VariantProps<typeof badgeVariants> & { children: ReactNode }) {
  return <span className={badgeVariants({ tone })}>{children}</span>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}</label>
}

export function Select(props: ComponentProps<'select'>) {
  return (
    <span className="field-select">
      <select {...props} />
      <ChevronDown className="field-select-icon" size={16} aria-hidden="true" focusable="false" />
    </span>
  )
}
