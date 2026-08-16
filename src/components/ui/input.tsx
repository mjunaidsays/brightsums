import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-[var(--radius-control)] border-2 border-border bg-card px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary-400 focus-visible:ring-4 focus-visible:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm font-bold text-foreground", className)}
      {...props}
    />
  )
}

function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className="text-sm font-semibold text-destructive">{children}</p>
}

export { Input, Label, FieldError }
