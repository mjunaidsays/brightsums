import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * BrightSums' reskinned Button — large pill shape, bold display font, and a
 * playful press animation. Every feature screen imports this rather than
 * styling a raw <button>, so the kid-friendly look stays consistent app-wide.
 * Default size meets the 44px+ tap-target minimum per CLAUDE.md §8.3.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-pill)] border-2 border-transparent font-display font-bold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/40 active:not-aria-[haspopup]:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--color-primary-700)] hover:brightness-105 active:shadow-[0_1px_0_0_var(--color-primary-700)] active:translate-y-[3px]",
        secondary:
          "bg-secondary-500 text-white shadow-[0_4px_0_0_var(--color-secondary-700)] hover:brightness-105 active:shadow-[0_1px_0_0_var(--color-secondary-700)] active:translate-y-[3px]",
        success:
          "bg-success-500 text-white shadow-[0_4px_0_0_var(--color-success-600)] hover:brightness-105 active:shadow-[0_1px_0_0_var(--color-success-600)] active:translate-y-[3px]",
        outline:
          "border-2 border-border bg-background text-foreground hover:bg-muted",
        ghost: "hover:bg-muted text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 gap-2 px-6 text-base",
        sm: "h-10 gap-1.5 px-4 text-sm",
        lg: "h-14 gap-2.5 px-8 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Base UI's Button assumes it's rendering a real <button> (nativeButton
  // defaults true) and warns otherwise. Every call site that passes
  // `render={<Link .../>}` etc. is rendering a non-button element on
  // purpose, so default nativeButton to false whenever `render` is present
  // rather than making every call site remember to pass it.
  const resolvedNativeButton = nativeButton ?? props.render === undefined
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={resolvedNativeButton}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
